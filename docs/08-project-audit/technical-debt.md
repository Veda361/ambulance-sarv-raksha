# Technical Debt

**Audit Date:** 2026-09-08

---

## CRITICAL — Insecure Shortcuts

| # | Debt Item | Location | Impact |
|---|-----------|----------|--------|
| TD-001 | **Unauthenticated registration endpoint** — any caller can create SUPER_ADMIN users | `authRoutes.ts` L53 | Privilege escalation vulnerability |
| TD-002 | **Secrets committed to git** — GitHub PAT, Notion token, Figma API key in tracked `.env` | `.env` (root) | Token exposure |
| TD-003 | **JWT secret is a readable string in `.env`** — not cryptographically generated, labeled "production_foundation" | `backend/.env` L5 | Weak secret |
| TD-004 | **CORS wildcard (`*`)** — allows any origin | `backend/.env` L8, `config/index.ts` L14 | CSRF risk |

## HIGH — Architecture Violations

| # | Debt Item | Location | Impact |
|---|-----------|----------|--------|
| TD-005 | **RLS policies bypassed** — `OR get_current_tenant_id() IS NULL` fallback + app never sets tenant context | `001_initial_schema.sql` L404-443; all service modules use direct `query()` not `withTenantContext()` | Tenant isolation relies entirely on application-layer WHERE clauses |
| TD-006 | **No rate limiting** — login, register, and all API endpoints unthrottled | Entire `app.ts` | Brute-force attacks possible |
| TD-007 | **No security headers** — no Helmet.js, no HSTS, no CSP | `app.ts` | XSS, clickjacking risks |
| TD-008 | **Hospital topic subscription bypass** — `canSubscribe()` returns `true` for any hospital/mission topic without ownership verification | `wsGateway.ts` L129-137 | Any authenticated user can subscribe to any hospital's or mission's realtime feed |

## MEDIUM — Missing Validation & Logic

| # | Debt Item | Location | Impact |
|---|-----------|----------|--------|
| TD-009 | **Organization route uses URL param for tenant ID** — `POST /organizations/:id/hospitals` takes tenantId from URL, not from auth context | `orgRoutes.ts` L99 | Potential tenant boundary bypass if user crafts URL |
| TD-010 | **listMissions doesn't join tenant check with user context** — uses `tenantId` from JWT but has no pagination metadata | `missionService.ts` L303-315 | Missing total count, no cursor-based pagination |
| TD-011 | **No password complexity validation** — register schema only requires `min(8)`, no uppercase/special char requirements | `authRoutes.ts` L15-30 | Weak passwords accepted |
| TD-012 | **`.env.example` contains actual credentials** — database password is the same as `.env` | `backend/.env.example` L4 | Confusion between example and real credentials |
| TD-013 | **No input sanitization** — relies solely on Zod schema validation, no SQL injection protection beyond parameterized queries | All route handlers | Could miss edge cases |

## MEDIUM — Missing Tests

| # | Debt Item | Location | Impact |
|---|-----------|----------|--------|
| TD-014 | **No WebSocket tests** — realtime gateway is untested | `wsGateway.ts` | Realtime failures undetected |
| TD-015 | **No negative auth tests** — no tests for expired tokens, invalid tokens, missing tokens | Test suite | Auth edge cases unverified |
| TD-016 | **No database-level tenant isolation tests** — E2E tests use supertest (application-level), not raw SQL | Test suite | RLS bypass undetected |
| TD-017 | **No load/stress tests** — no performance baselines | Test suite | Capacity unknown |

## LOW — Code Quality

| # | Debt Item | Location | Impact |
|---|-----------|----------|--------|
| TD-018 | **`any` type used extensively** — service methods return `Promise<any>` throughout | All service modules | Type safety undermined |
| TD-019 | **No response DTOs** — all responses return raw database row objects | All services | API contract fragile; DB schema changes break clients |
| TD-020 | **Audit hash chain is global** — not partitioned by tenant | `auditService.ts` L22-24 | Cross-tenant ordering dependency; potential bottleneck |
| TD-021 | **No API versioning strategy** — `/api/v1/` exists but no deprecation or migration plan | `api/v1/index.ts` | Future API evolution unclear |
| TD-022 | **Event bus is in-memory singleton** — `DomainEventBus` uses Node.js EventEmitter | `events.ts` | Events lost on process restart; no persistence |
| TD-023 | **Unused parameter warnings** — `_actorRole`, `_tenantId`, `_hospitalId` in several service methods | `missionService.ts` L29, `clinicalService.ts` L119 | Dead parameter code |
| TD-024 | **No API request logging** — only debug-level request log, no structured access log | `app.ts` L21-24 | No access audit trail for API requests |

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 4 |
| HIGH | 4 |
| MEDIUM | 9 |
| LOW | 7 |
| **Total** | **24** |
