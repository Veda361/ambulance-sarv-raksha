# ADR-P1-008: Domain Event Architecture vs. Audit Events vs. Transaction Logs

**Status:** APPROVED  
**Date:** 2026-09-06  
**Deciders:** Principal Software Architect, Systems Architect, Security Architect  
**Phase:** Phase 1 — Production Engineering Foundation

---

## 1. Context
Modern distributed and event-driven systems often conflate three distinct operational concepts:
1. **Domain Events:** In-process signals within the application indicating that a business entity changed state.
2. **Audit Events:** Immutable, medicolegal compliance records capturing actor, action, timestamp, and payload diff.
3. **Database Transaction Logs (WAL):** Low-level database engine byte streams used for replication and crash recovery.

---

## 2. Problem
How must events be defined, separated, and routed so that domain workflows do not couple with audit storage and operational consumers receive reliable notifications?

---

## 3. Decision
**Explicitly Distinguish and Implement Three Event Tiers:**

1. **Domain Events (In-Process Asynchronous Bus):**
   - Implemented via `DomainEventBus` (TypeScript in-memory event emitter).
   - Used for decoupling domain modules (e.g. `MISSION_ACCEPTED` event triggers `NotificationService` and `LocationTrackingService`).
   - Ephemeral; not persisted directly.

2. **Audit Events (Append-Only Relational Journal):**
   - Persisted synchronously to `audit_logs` table.
   - Captures: `id`, `tenant_id`, `actor_id`, `action`, `resource_type`, `resource_id`, `timestamp`, `ip_address`, `details`.
   - Never modified or deleted (Write-Once-Read-Many).

3. **Realtime Broadcast Events (Edge Push Boundary):**
   - Transformed from domain events and emitted across WebSocket channels.
   - Filtered strictly by tenant and mission authorization.

---

## 4. Consequences
* **Consequences:** Clear conceptual boundaries. Domain services do not write SQL directly to audit logs; audit handlers listen to the event bus or are invoked explicitly inside use-case transaction boundaries.
