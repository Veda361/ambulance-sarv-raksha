# Domain Model Implementation & Entity Ownership

**Document ID:** `docs/07-phase1/domain-implementation.md`  
**Status:** COMPLETED / VERIFIED

---

## 1. Domain Implementation Status

| Entity Name | Phase 1 Status | Module Location | Persistence Table | Ownership Boundary | Sensitivity Level |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Organization** | **PHASE 1 IMPLEMENTED** | `modules/organization` | `organizations` | Platform Level / Top-Level Tenant | Commercial / Operational |
| **User** | **PHASE 1 IMPLEMENTED** | `modules/identity` | `users` | Organization (`tenant_id`) | Confidential (Credentials) |
| **Role & Permission** | **PHASE 1 IMPLEMENTED** | `modules/authorization`| In-Memory Matrix | System-Wide Immutable | Public Metadata |
| **Hospital** | **PHASE 1 IMPLEMENTED** | `modules/organization` | `hospitals` | Organization (`tenant_id`) | Operational |
| **Ambulance** | **PHASE 1 IMPLEMENTED** | `modules/fleet` | `ambulances` | Organization (`tenant_id`) | Operational / Asset |
| **Crew (Shift)** | **PHASE 1 IMPLEMENTED** | `modules/fleet` | `crew_shifts` | Organization (`tenant_id`) | Operational / HR |
| **Device (IoT)** | **PHASE 1 IMPLEMENTED** | `modules/device` | `devices` | Organization (`tenant_id`) | Confidential (API Keys) |
| **Patient** | **PHASE 1 IMPLEMENTED** | `modules/patient` | `patients` | Organization (`tenant_id`) | **HIGH PHI (Protected)** |
| **Mission** | **PHASE 1 IMPLEMENTED** | `modules/mission` | `missions` | Organization (Central Aggregate)| Operational & Sensitive |
| **MissionEvent** | **PHASE 1 IMPLEMENTED** | `modules/mission` | `mission_events` | Mission (`mission_id`) | Operational Audit |
| **Location** | **PHASE 1 IMPLEMENTED** | `modules/location` | `locations` | Mission (`mission_id`) | Telematics |
| **VitalMeasurement** | **PHASE 1 IMPLEMENTED** | `modules/clinical` | `vital_measurements` | Mission / Patient | **HIGH PHI (Clinical)** |
| **Alert** | **PHASE 1 IMPLEMENTED** | `modules/clinical` | `alerts` | Mission (`mission_id`) | Clinical Emergency |
| **AuditLog** | **PHASE 1 IMPLEMENTED** | `modules/audit` | `audit_logs` | Platform Governance | Medicolegal (WORM) |
| **HospitalArrival** | **PHASE 1 SCAFFOLDED** | `modules/mission` | Encompassed in `missions.state`| Mission / Hospital | Operational |
| **Handover** | **PHASE 1 IMPLEMENTED** | `modules/mission` | In `missions(handover_notes)` | Mission (Dual Sign-off) | Medicolegal |
| **Notification** | **PHASE 1 SCAFFOLDED** | `realtime/wsGateway` | Realtime WebSocket frames | Transient (Redis/WS) | Operational Alerts |
| **Subscription** | **FUTURE (Phase 2)** | `modules/billing` | Deferred to Phase 2 | Organization | Commercial Billing |
| **FeatureEntitlement** | **NOT REQUIRED YET** | Core Feature Flags | In-Memory Defaults | System-Wide | Platform Metadata |

---

## 2. Entity Ownership, Lifecycles & Mutation Authority

### 2.1 Mission (Central Aggregate Root)
* **Identity:** Generated human-readable code: `MSN-YYYYMMDD-XXXX` (e.g. `MSN-20260906-8F3A`).
* **Lifecycle:** 13-state FSM (`REQUESTED` $\rightarrow$ `DISPATCHING` $\rightarrow$ `ASSIGNED` $\rightarrow$ `ACCEPTED` $\rightarrow$ `EN_ROUTE_TO_PICKUP` $\rightarrow$ `ARRIVED_PICKUP` $\rightarrow$ `PATIENT_ONBOARD` $\rightarrow$ `EN_ROUTE_TO_HOSPITAL` $\rightarrow$ `ARRIVED_HOSPITAL` $\rightarrow$ `HANDOVER` $\rightarrow$ `COMPLETED`).
* **Creation Authority:** Dispatchers, Hospital Admins, Organization Admins.
* **Mutation Authority:** Strictly constrained by the Finite State Machine (`stateMachine.ts`). Drivers advance transit milestones; Triage Nurses seal clinical handover.
* **Deletion Policy:** Deletion is strictly prohibited. Terminal states are `COMPLETED` and `CANCELLED`.
* **Cross-Tenant Sharing:** Shared transiently with destination hospitals via dynamic RLS envelope rules.

### 2.2 Patient
* **Identity:** UUIDv4 primary key.
* **Sensitivity:** High PHI. Protected Health Information is structurally shielded from non-clinical roles. Super Admins, Drivers, and Government Regulators have zero read/write access to patient names and chief complaints.
* **Retention:** Immutable after completed handover. Retained for 7 years under statutory compliance.

### 2.3 Ambulance & Crew
* **Identity:** Unique vehicle registration number and call sign.
* **Decoupled Relationship:** Drivers and EMTs are not permanently hardcoded to vehicles. They are assigned via `crew_shifts` records, allowing dynamic shift rotations.
* **Availability State:** Automatically synchronized when mission state transitions occur (e.g. transitioning mission to `ASSIGNED` marks ambulance as `ASSIGNED`; `COMPLETED` returns ambulance to `AVAILABLE`).
