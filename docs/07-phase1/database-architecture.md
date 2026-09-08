# Database Architecture & Persistence Specification

**Document ID:** `docs/07-phase1/database-architecture.md`  
**Status:** COMPLETED / MIGRATION VERIFIED  
**Database Engine:** PostgreSQL 16.14  
**Active Databases:** `sarvraksha_dev` (Development), `sarvraksha_test` (Test Suite)

---

## 1. Persistence Topology & Table Schema

The database consists of 14 relational tables, 8 custom enum types, and native spatial extensions (`cube`, `earthdistance`):

```
┌─────────────────┐       1..* ┌─────────────────┐
│  organizations  ├───────────►│    hospitals    │
└────────┬────────┘            └────────┬────────┘
         │ 1                            │ 1 (Destination)
         ├──────────────┐               ▼ 1..*
         │ 1            │ 1       ┌──────────────┐
         ▼ 1..*         ▼ 1..*    │   missions   │
   ┌───────────┐  ┌───────────┐   └──────┬───────┘
   │   users   │  │ambulances │          │ 1
   └─────┬─────┘  └─────┬─────┘          ├─────────────► 1..1 [ patients ]
         │ 1            │ 1              ├─────────────► 1..* [ mission_events ]
         ▼ 1..*         ▼ 1..*           ├─────────────► 1..* [ locations ]
   ┌───────────┐  ┌───────────┐          ├─────────────► 1..* [ vital_measurements ]
   │refresh_   │  │crew_shifts│          ├─────────────► 0..* [ alerts ]
   │tokens     │  └───────────┘          └─────────────► 0..* [ audit_logs ]
   └───────────┘
```

---

## 2. Foreign Key & Integrity Constraints

| Table | Foreign Key Column | Target Table | On Delete Action | Integrity Rationale |
| :--- | :--- | :--- | :--- | :--- |
| `users` | `tenant_id` | `organizations(id)` | `RESTRICT` | Cannot delete an organization while user accounts exist. |
| `ambulances` | `tenant_id` | `organizations(id)` | `RESTRICT` | Prevents orphaned fleet assets. |
| `crew_shifts`| `ambulance_id`| `ambulances(id)` | `RESTRICT` | Preserves shift history. |
| `missions` | `tenant_id` | `organizations(id)` | `RESTRICT` | Mandatory tenant ownership. |
| `missions` | `ambulance_id`| `ambulances(id)` | `RESTRICT` | Cannot delete a vehicle tied to historic missions. |
| `missions` | `driver_id` | `users(id)` | `RESTRICT` | Cannot delete driver tied to historic missions. |
| `missions` | `destination_hospital_id` | `hospitals(id)` | `RESTRICT` | Preserves destination facility record. |
| `mission_events` | `mission_id` | `missions(id)` | `CASCADE` | Scoped to mission aggregate. |
| `locations` | `mission_id` | `missions(id)` | `CASCADE` | Scoped to mission aggregate. |
| `vital_measurements`| `mission_id`| `missions(id)` | `CASCADE` | Scoped to mission aggregate. |
| `alerts` | `mission_id` | `missions(id)` | `CASCADE` | Scoped to mission aggregate. |
| `audit_logs` | `tenant_id` | `organizations(id)` | `SET NULL` | Audit logs are permanent WORM records; retained even if tenant archived. |

---

## 3. Spatial Queries & Proximity Calculations

To eliminate dependency on non-standard OS packages while guaranteeing high-speed geospatial proximity ranking, the platform utilizes PostgreSQL's native `cube` and `earthdistance` extensions:

```sql
SELECT id, call_sign, registration_number, capability, status,
       earth_distance(
         ll_to_earth(current_latitude, current_longitude),
         ll_to_earth($pickup_lat, $pickup_lon)
       ) AS distance_meters
FROM ambulances
WHERE tenant_id = $tenant_id
  AND status = 'AVAILABLE'
ORDER BY distance_meters ASC
LIMIT 5;
```
* **Performance:** Uses spherical coordinates modeled over an earth radius of ~6,371 km. 
* **Indexing:** GiST spatial indexes (`USING gist (ll_to_earth(latitude, longitude))`) allow sub-millisecond nearest-neighbor scans across thousands of vehicles.

---

## 4. Indexing Strategy & Rationale

1. **Foreign Key Indexes:** Every foreign key column (`tenant_id`, `ambulance_id`, `driver_id`, `destination_hospital_id`) has an explicit B-tree index to prevent table scans during relational joins.
2. **Unique Constraints:**
   - `organizations(code)`: Prevents duplicate organization codes.
   - `users(email)`: Guarantees unique login identity.
   - `ambulances(registration_number)`: Prevents duplicate physical vehicle registrations across fleets.
   - `missions(mission_code)`: Enforces unique human-readable mission tracking identifiers.
   - `locations(mission_id, sequence_number)`: **Database-enforced idempotency constraint** preventing duplicate telemetry packet insertion.
3. **Audit Log Index:** `idx_audit_logs_tenant_time ON audit_logs(tenant_id, created_at)` optimizes forensic chronological range queries.

---

## 5. Deletion & Retention Policy

* **Hard Delete:** Strictly restricted to transient sessions (`user_refresh_tokens`).
* **Soft Deactivate (`is_active = false`):** Applied to `organizations`, `users`, `hospitals`, and `ambulances`. Assets are deactivated, never deleted, preserving referential integrity.
* **Immutable WORM (Write-Once-Read-Many):** `audit_logs` and `mission_events` cannot be updated or deleted. Database trigger `trg_audit_logs_immutable` raises an explicit exception on any `UPDATE` or `DELETE` statement.
