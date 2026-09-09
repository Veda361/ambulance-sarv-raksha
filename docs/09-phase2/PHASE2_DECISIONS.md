# Phase 2 — Architectural Decision Records (ADRs)

**Document Reference**: `docs/09-phase2/PHASE2_DECISIONS.md`  

---

## ADR-P2-001: Hospital Web Architecture (React + Vite + Leaflet)
* **Status**: `CONFIRMED`
* **Context**: Phase 2 requires a hospital-side web interface supporting high-performance dispatch, live mapping, and receiving coordination.
* **Decision**: Implement a Single Page Application using React 18, Vite, TypeScript, and Vanilla CSS with a clinical design system. Leaflet is adopted for mapping with OpenStreetMap tiles to avoid commercial map API vendor lock-in.
* **Consequences**: Zero framework proliferation. Fast local dev cycles, minimal bundle overhead (107 kB gzipped JS), responsive rendering.

---

## ADR-P2-002: Concurrency-Safe Ambulance Assignment
* **Status**: `CONFIRMED`
* **Context**: In high-tempo emergency centers, two dispatchers may select the same ambulance simultaneously.
* **Decision**: Enforce pessimistic row locking (`SELECT id, status FROM ambulances WHERE id = $1 FOR UPDATE`) inside the creation transaction. Require `status === 'AVAILABLE'`.
* **Consequences**: Exactly one dispatcher transaction succeeds; the competing transaction receives a clean `409 Conflict: Ambulance is not available for assignment`. Prevents double-booking.

---

## ADR-P2-003: Idempotency Key Tracking via Middleware
* **Status**: `CONFIRMED`
* **Context**: Mobile or clinical web clients may encounter brief network disconnects and retry mutation requests.
* **Decision**: Implement `idempotencyMiddleware` evaluating `Idempotency-Key` headers on mutating HTTP methods. Store responses in an `idempotency_keys` table with 24-hour expiration.
* **Consequences**: Retried requests return cached responses with `X-Idempotent-Replay: true` header without re-executing state transitions or audit records.

---

## ADR-P2-004: Inbound Hospital Destination Envelope
* **Status**: `CONFIRMED`
* **Context**: Missions originating from independent ambulance fleet operators (Tenant A) transporting to private hospitals (Tenant B) require cross-tenant visibility at the receiving facility without leaking unrelated missions.
* **Decision**: Expand `listMissions` and `wsGateway` subscription authorization to include destination hospital ownership checks (`destination_hospital_id IN (SELECT id FROM hospitals WHERE tenant_id = $1)`).
* **Consequences**: Seamless pre-arrival radar coordination across organizational boundaries while maintaining mathematical multi-tenant separation.
