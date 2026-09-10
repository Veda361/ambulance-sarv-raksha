# Feature Status Matrix

**Audit Date:** 2026-09-08

---

| Feature | Status | Evidence | Tests | Production Readiness | Dependencies | Next Phase |
|---------|--------|----------|-------|---------------------|--------------|------------|
| **Authentication** | IMPLEMENTED | `identityService.ts` — login, register, refresh, logout; bcrypt password hashing; JWT generation with claims (sub, tenantId, role, email, name) | E2E: user registration, login, token validation (test 3) | DEV — JWT secret in `.env`, no rate limiting on login | None | Security hardening |
| **JWT** | IMPLEMENTED | 15-min access tokens; 7-day refresh tokens (hashed SHA-256 in DB); revocation on logout; auto-refresh endpoint | E2E: token flow tested | DEV — no token rotation on refresh, no blacklisting | None | Token rotation |
| **RBAC** | IMPLEMENTED | `permissions.ts` — 8 roles × 11 resources × 6 actions; `rbacGuard.ts` middleware; Zero-PHI enforcement for SUPER_ADMIN | 4 unit tests covering RBAC matrix | DEV — no attribute-based access control | Authentication | Fine-grained ABAC |
| **Multi-tenancy** | IMPLEMENTED | `tenant_id` FK on all domain tables; RLS policies in migration; `withTenantContext()` helper; cross-tenant mission envelope for destination hospital | E2E: tenant isolation test (test 13); driver isolation (test 14) | DEV — RLS not used by application (app uses WHERE clauses); `OR get_current_tenant_id() IS NULL` bypass in RLS | Authentication | Enforce RLS in app layer |
| **Organizations** | IMPLEMENTED | `organizationService.ts` — CRUD; duplicate code check; audit logging | E2E: org creation (test 1) | DEV — no update/delete API | None | Add update/delete endpoints |
| **Hospitals** | IMPLEMENTED | Hospital CRUD in `organizationService.ts`; spatial index; diversion status field; trauma level | E2E: hospital creation (test 2) | DEV — no diversion management API | Organizations | Diversion management |
| **Ambulances** | IMPLEMENTED | `fleetService.ts` — create, list, status update, nearest spatial query with earthdistance | E2E: ambulance registration and nearest query (tests 4-5) | DEV — no maintenance tracking | Organizations | Maintenance scheduling |
| **Crew** | IMPLEMENTED | `fleetService.ts` — crew shift creation (driver + optional EMT per ambulance) | E2E: implicitly tested through mission flow | DEV — no shift end management | Ambulances | Shift management UI |
| **Patients** | IMPLEMENTED | `patientService.ts` — create, get by ID; tenant-scoped queries | E2E: patient creation (test 6) | DEV — no update, no search, no PHI encryption at rest | Organizations | Patient search, update |
| **Missions** | IMPLEMENTED | `missionService.ts` — create (auto-advance to ASSIGNED), get, list; tenant + cross-tenant hospital envelope; Zero-PHI redaction for Driver role | E2E: full lifecycle (tests 7-12) | DEV — no pagination metadata, no filtering | Ambulances, Hospitals, Patients | Mission search, filtering |
| **Mission FSM** | IMPLEMENTED | `stateMachine.ts` — 13 states, deterministic transitions, role-based authorization per transition; terminal state enforcement; `FOR UPDATE` row locking | 6 unit tests covering valid/invalid/unauthorized transitions | DEV — no timeout handling, no SLA tracking | Missions | Timeout automation |
| **Mission Events** | IMPLEMENTED | Immutable event journal in `mission_events` table; records from_state, to_state, actor, metadata on every transition | Implicitly tested via E2E | DEV — no event replay, no event sourcing | Missions | Event replay API |
| **Audit** | IMPLEMENTED | `auditService.ts` — SHA-256 hash chain (WORM); immutability trigger prevents UPDATE/DELETE; chain integrity verification | E2E: chain integrity check (test 16); immutability test (test 17) | DEV — hash chain per-instance, not per-tenant; no external tamper detection | None | External audit sink |
| **GPS** | PARTIAL | Backend `locationService.ts` records GPS breadcrumbs with deduplication (mission_id + sequence_number); updates ambulance position; calculates ETA via earthdistance | E2E: GPS ingestion + deduplication (test 10) | DEV — no mobile GPS integration, no map rendering, server-only | Missions, Ambulances | Android GPS, map display |
| **Location Tracking** | PARTIAL | Server-side location storage and latest-location query; ambulance position update on each telemetry packet | E2E: tested | DEV — no location history API, no route rendering | GPS | Location history endpoint |
| **ETA** | PARTIAL | Dynamic ETA calculated from earthdistance / speed; stored on mission; broadcast via WebSocket | ETA verified >0 in E2E test | DEV — linear distance calculation, not road-network routing | GPS | Road-network routing integration |
| **Routing** | NOT_STARTED | No road-network routing implementation | None | N/A | GPS | Integrate routing API |
| **Vitals** | IMPLEMENTED | `clinicalService.ts` records time-series vitals; NEWS2 auto-scoring; critical alert generation | E2E: critical vitals + alert (test 11); NEWS2 unit tests (3 cases) | DEV — no vital history API, no trending | Patients, Missions | Vital history, trending |
| **Alerts** | IMPLEMENTED | Auto-generated from NEWS2 critical scores; stored in alerts table; broadcast to hospital radar WebSocket channel | E2E: alert creation verified (test 11) | DEV — no alert acknowledgment API, no escalation | Vitals | Alert acknowledgment, escalation |
| **IoT** | PARTIAL | `deviceService.ts` — device registration with API key; device authentication; telemetry ingestion via `/api/v1/devices/telemetry` | E2E: device telemetry flow | DEV — software-only, no firmware, no OTA | Ambulances | Firmware development |
| **Realtime** | PARTIAL | `wsGateway.ts` — WebSocket server with JWT auth, topic subscription, tenant-scoped broadcast, heartbeat/liveness | Not directly tested | DEV — single process, no Redis, no horizontal scaling | Authentication | Redis pub/sub adapter |
| **Hospital Dashboard** | NOT_STARTED | `web/` is empty | None | N/A | Phase 1 | Create React app |
| **Driver App** | NOT_STARTED | Android is scaffold-only | None | N/A | Phase 1 | Implement driver features |
| **EMT App** | NOT_STARTED | Android is scaffold-only | None | N/A | Phase 1 | Implement EMT features |
| **Receiving Hospital** | PARTIAL | Cross-tenant mission visibility; hospital radar WebSocket broadcasts | E2E: tenant isolation allows hospital access | DEV — no dedicated UI | Dashboard | Build receiving UI |
| **Notifications** | NOT_STARTED | No push/SMS/email implementation | None | N/A | Phase 1 | Integrate Firebase/SNS |
| **Offline** | NOT_STARTED | No offline queue or local storage | None | N/A | Android App | Implement Room DB |
| **Fleet Management** | PARTIAL | CRUD + spatial nearest + status management + crew shifts | E2E tested | DEV — no maintenance scheduling | Ambulances | Maintenance module |
| **Government Dashboard** | NOT_STARTED | Role exists in RBAC only | None | N/A | Dashboard | Build government view |
| **Analytics** | NOT_STARTED | No analytics | None | N/A | Multiple | Build analytics engine |
| **Billing** | NOT_STARTED | No billing | None | N/A | Phase 16 | Implement billing |
| **Subscriptions** | NOT_STARTED | No subscriptions | None | N/A | Billing | Implement subscriptions |
| **External API** | NOT_STARTED | No external API | None | N/A | Core APIs | API gateway |
| **Device Management** | PARTIAL | Register + authenticate only | None | DEV | IoT | Device dashboard, OTA |
| **Security** | PARTIAL | Auth + RBAC + Zero-PHI + log redaction implemented; NO rate limiting, NO security headers, NO HTTPS enforcement, NO CSRF | None specifically | DEV — multiple gaps | Phase 1 | Implement rate limiting, headers |
| **Observability** | PARTIAL | `/health`, `/ready`, `/metrics`; Pino structured logging | E2E: health endpoint tests (test 18) | DEV — no monitoring stack | Phase 1 | Deploy Prometheus + Grafana |
| **CI/CD** | NOT_STARTED | No pipeline | None | N/A | None | Create GitHub Actions |
| **Backup** | NOT_STARTED | No backup strategy | None | N/A | Database | Implement pg_dump automation |
| **Disaster Recovery** | NOT_STARTED | No DR | None | N/A | Backup | DR plan and implementation |
| **Deployment** | NOT_STARTED | No containerization or deployment | None | N/A | CI/CD | Dockerfile, docker-compose |
| **Compliance** | NOT_STARTED | PHI redaction only | None | N/A | Security | Compliance framework |
