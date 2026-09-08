# Event Architecture: Domain, Audit & Realtime Streams

**Document ID:** `docs/07-phase1/event-architecture.md`  
**Status:** COMPLETED / VERIFIED BY TEST SUITE

---

## 1. Event Taxonomy & Structural Separation

The platform enforces clear boundaries across three distinct event mechanisms:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           EVENT ARCHITECTURE TIERS                              │
├──────────────────────┬─────────────────────────────┬────────────────────────────┤
│ 1. DOMAIN EVENTS     │ 2. AUDIT EVENTS             │ 3. REALTIME EVENTS         │
├──────────────────────┼─────────────────────────────┼────────────────────────────┤
│ In-process signal    │ Immutable legal record      │ Outbound WebSocket frame   │
│ In-memory bus        │ PostgreSQL WORM table       │ Client-side JSON payload   │
│ Asynchronous/Typed   │ Cryptographic hash chain    │ Scoped topic broadcast     │
│ Decouples services   │ Non-repudiation & forensics │ Live radar & alerts        │
└──────────────────────┴─────────────────────────────┴────────────────────────────┘
```

---

## 2. Domain Event Bus Specification

The `DomainEventBus` (`backend/src/shared/events.ts`) provides an in-process, typed pub/sub bus:

```typescript
export interface DomainEvent<T = any> {
  eventId: string;          // Unique UUIDv4
  eventType: string;        // e.g. 'MISSION_ASSIGNED', 'ALERT_TRIGGERED'
  aggregateId: string;      // Central entity ID (e.g. mission_id)
  tenantId?: string;        // Scoped tenant context
  actorId?: string;         // User or System triggering the event
  occurredAt: string;       // ISO 8601 UTC timestamp
  payload: T;               // Strongly typed payload
  correlationId?: string;   // X-Request-ID propagation
}
```

### Core Domain Event Catalog:
* `MISSION_ASSIGNED`: Emitted when an ambulance and driver are bound to a mission.
* `MISSION_ACCEPTED`: Emitted when a driver acknowledges an emergency dispatch.
* `MISSION_STATE_CHANGED`: Emitted on every milestone transition (`EN_ROUTE`, `ARRIVED`, etc.).
* `LOCATION_RECORDED`: Emitted when valid, non-duplicate GPS telemetry is ingested.
* `VITAL_RECORDED`: Emitted when physiological measurements are attached to a patient.
* `ALERT_TRIGGERED`: Emitted when clinical deterioration (NEWS2 $\ge 7$) or operational timeout occurs.
* `MISSION_COMPLETED`: Emitted when clinical handover is sealed by hospital triage.

---

## 3. Cryptographic Audit Journal (WORM)

Audit events are persisted synchronously in the `audit_logs` table via `AuditService.record()`:
* **Hash Chaining:** Each record calculates:
  $$\text{Hash}_N = \text{SHA256}(\text{Hash}_{N-1} + \text{TenantID} + \text{ActorID} + \text{Action} + \text{ResourceType} + \text{ResourceId} + \text{Payload} + \text{Timestamp})$$
* **Database Immutability:** Trigger `trg_audit_logs_immutable` executes on any `UPDATE` or `DELETE` query, raising an exception and blocking direct modification.
* **Integrity Auditing:** Calling `AuditService.verifyChainIntegrity()` sequentially walks the chain from genesis, detecting any retroactive tampering.
