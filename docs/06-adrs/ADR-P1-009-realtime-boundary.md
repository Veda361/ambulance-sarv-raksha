# ADR-P1-009: Realtime Boundary, Topic Scoping & WebSocket Connection Lifecycle

**Status:** APPROVED  
**Date:** 2026-09-06  
**Deciders:** Principal Software Architect, Realtime Engineer, Security Architect  
**Phase:** Phase 1 — Production Engineering Foundation

---

## 1. Context
Emergency dispatchers and receiving hospital emergency departments require sub-second streaming updates of vehicle locations, mission milestone changes, and clinical deterioration alerts.

---

## 2. Problem
How should the realtime boundary be architected in Phase 1 to ensure that unauthorized clients cannot eavesdrop on cross-tenant emergency events or clinical data?

---

## 3. Decision
**Implement a Token-Authenticated WebSocket Boundary with Scoped Topic Subscriptions.**

1. **Connection Authentication:** WebSocket connections require an initial handshake with a valid JWT token (`/?token=<jwt>` or `Authorization` header). Unauthenticated sockets are terminated with code 4401.
2. **Connection Context:** The socket is tagged with the user's `tenant_id`, `user_id`, and `role`.
3. **Topic Subscription Authorization:** Clients subscribe to topics via JSON control messages:
   - `subscribe:tenant:fleet` (Requires Dispatcher or Org Admin role for that tenant).
   - `subscribe:hospital:{id}:radar` (Requires Hospital Admin or Receiving Hospital role for that hospital).
   - `subscribe:mission:{id}:telemetry` (Requires active assigned driver, EMT, or authorized hospital receiving the mission).
4. **Broadcast Enforcement:** The server broadcasts messages strictly to sockets whose authenticated context matches the event's tenant and topic boundaries.

---

## 4. Consequences
* **Consequences:** Real-time messages never bypass authorization. Guarantees zero eavesdropping on live telemetry.
