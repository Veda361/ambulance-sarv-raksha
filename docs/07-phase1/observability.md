# Observability, Structured Logging & Health Check Baseline

**Document ID:** `docs/07-phase1/observability.md`  
**Status:** COMPLETED / VERIFIED BY TEST SUITE  
**Parent Decision:** Phase 1 ADR-P1-010

---

## 1. Structured JSON Logging & Privacy Redaction

The platform uses `pino` (`backend/src/shared/logger.ts`) for high-throughput, structured JSON logging.

### Automated Redaction of Sensitive Data & PHI:
To prevent leakage of patient demographics or credentials into log aggregators (Datadog, Loki, CloudWatch), automated redaction paths are configured at the logger root:
```typescript
paths: [
  'password',
  'password_hash',
  'token',
  'refreshToken',
  'authorization',
  'headers.authorization',
  'patient_name',
  'contact_phone',
  'national_id',
  'address_details',
],
censor: '[REDACTED_SENSITIVE]'
```

### Log Line Schema:
```json
{
  "level": 30,
  "time": "2026-09-06T17:15:30.120Z",
  "env": "production",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "tenantId": "org-apex-001",
  "userId": "user-ramesh-12",
  "action": "MISSION_TRANSITION_ACCEPTED",
  "msg": "Mission state transitioned successfully"
}
```

---

## 2. Distributed Tracing & Request Correlation

1. **Middleware (`requestIdMiddleware`):** Every incoming HTTP request and WebSocket handshake is assigned a unique `X-Request-ID` (UUIDv4).
2. **Propagation:** Downstream log messages, database queries, and error responses echo this `requestId`.
3. **Response Header:** `X-Request-ID` is returned in all HTTP response headers, allowing mobile and web frontends to report exact trace IDs to support engineers during triage.

---

## 3. Health & Readiness Probes

The application provides tri-state observability endpoints mounted directly on the HTTP root:

| Endpoint | Purpose | Upstream Check | Expected Response |
| :--- | :--- | :--- | :--- |
| **`GET /health`** | Kubernetes Liveness Probe | Node.js process event loop responsiveness | `HTTP 200 { "status": "UP", "uptimeSeconds": 124 }` |
| **`GET /ready`** | Kubernetes Readiness Probe | Live PostgreSQL connection pool (`SELECT 1`) | `HTTP 200 { "status": "READY", "database": "CONNECTED" }` (or `503` if DB down) |
| **`GET /metrics`**| Operational Telemetry | Heap usage, connection pool, active WebSockets | `HTTP 200 { "process": { ... }, "realtime": { ... }, "pool": { ... } }` |
