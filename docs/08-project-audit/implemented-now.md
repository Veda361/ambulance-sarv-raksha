# What Is Already Implemented

**Audit Date:** 2026-09-08

---

## FULLY IMPLEMENTED

These features have actual working code with test coverage.

| Feature | Evidence Files | Test Coverage |
|---------|---------------|---------------|
| **JWT Authentication** (login, register, refresh, logout, token validation) | `identityService.ts`, `authRoutes.ts`, `authGuard.ts` | E2E: registration, login, token flow |
| **RBAC Permission Matrix** (8 roles × 11 resources × 6 actions) | `permissions.ts`, `rbacGuard.ts` | 4 unit tests, E2E enforcement |
| **Zero-PHI Enforcement** (SUPER_ADMIN + DRIVER cannot access patient/vital) | `rbacGuard.ts` L12-14, `missionService.ts` L295-298 | Unit: RBAC tests; E2E: test 15 |
| **Mission FSM** (13-state deterministic finite state machine) | `stateMachine.ts` — 107 lines | 6 unit tests: valid, invalid, unauthorized, terminal, cancellation |
| **Mission Lifecycle** (create, auto-assign, transition, get, list) | `missionService.ts` — 317 lines | E2E: full golden path (tests 7-12) |
| **NEWS2 Clinical Scoring** (5-parameter early warning score) | `news2.ts` — 129 lines | 3 unit tests: normal, hypoxia, aggregate critical |
| **Audit Hash Chain** (SHA-256 WORM append-only log with immutability trigger) | `auditService.ts`, migration L345-374 | E2E: chain integrity (test 16), immutability (test 17) |
| **Health/Readiness Probes** (/health, /ready, /metrics) | `app.ts` L30-77 | E2E: test 18 |
| **Structured Logging** (Pino with PHI field redaction) | `logger.ts` | Implicitly tested |
| **Error Handling** (typed errors: 400/401/403/404/409/429/500 + Zod validation) | `errors.ts`, `errorHandler.ts` | E2E: error codes tested |
| **Database Migration System** (versioned, checksummed, transactional) | `migrate.ts` | E2E: runs before tests |

---

## PARTIALLY IMPLEMENTED

Working code exists but missing significant functionality for phase completion.

| Feature | What Works | What's Missing |
|---------|-----------|----------------|
| **Multi-tenancy** | `tenant_id` FK on all tables; RLS policies defined; `withTenantContext()` helper; cross-tenant hospital envelope; application-layer WHERE filtering | RLS policies have `OR get_current_tenant_id() IS NULL` bypass; application layer doesn't call `SET LOCAL app.current_tenant_id`; no DB-level enforcement in regular queries |
| **Fleet Management** | Ambulance CRUD, status management, nearest-ambulance spatial query, crew shifts | No maintenance scheduling, no analytics, no availability calendar |
| **Patient Management** | Create patient, get by ID, tenant-scoped | No update, no search, no list, no PHI encryption at rest |
| **Clinical/Vitals** | Record vitals, NEWS2 auto-scoring, critical alert generation | No vital history endpoint, no trending, no non-critical alerts |
| **GPS/Location** | Server-side ingestion, deduplication, ETA calculation, ambulance position update | No mobile GPS integration, no map display, no location history API |
| **IoT Boundary** | Device registration, API-key authentication, telemetry ingestion | No firmware, no real sensors, no OTA, no device monitoring |
| **Realtime/WebSocket** | JWT-authenticated WS, topic subscription, tenant-scoped broadcast, heartbeat | Single-process only, no Redis pub/sub, no reconnection, no horizontal scaling |
| **Observability** | Health probes, structured logging, basic metrics | No Prometheus/Grafana, no alerting, no distributed tracing |
| **Security** | Auth + RBAC + Zero-PHI + log redaction | No rate limiting, no security headers, no HTTPS, no CSRF, no pen testing |
| **Testing** | 4 test files, 18 test cases, unit + integration | No tenant isolation DB tests, no WebSocket tests, no negative auth tests |

---

## SCAFFOLDED

Project structure exists but no meaningful implementation.

| Component | Evidence |
|-----------|----------|
| **Android App** | Gradle project with `MainActivity.kt` showing "Hello Android"; Jetpack Compose theme files; no business logic |
| **Web Dashboard** | `web/` directory with `.gitkeep` only; no framework, no source code |

---

## SIMULATED

No features are currently simulated. All implemented features operate against real database operations, not mocks or simulators.

---

## DOCUMENTED ONLY

These exist only in documentation with zero implementation.

| Feature | Documentation |
|---------|--------------|
| Notifications (Push/SMS/Email) | Mentioned in requirements |
| Offline-First Mobile | ADR-007 strategy defined |
| Advanced Dispatch Algorithm | Mentioned in product charter |
| Government Command Center | Persona and role defined |
| Analytics & Reporting | Mentioned in product scope |
| Subscription/Billing | Business model documented |
| External API Gateway | Planned |
| Backup/DR | Mentioned in production scope |
| Compliance/HIPAA | Privacy requirements documented |
