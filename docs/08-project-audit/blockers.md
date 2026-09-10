# Blockers

**Audit Date:** 2026-09-08

---

## Active Blockers

### BLK-001: Secrets Committed to Repository

| Property | Value |
|----------|-------|
| **Phase** | Phase 1, Phase 19 |
| **Problem** | Root `.env` file contains [REDACTED SECRET DETECTED] — GitHub PAT, Notion token, and Figma API key are committed to the repository. Backend `.env` contains a development JWT secret and database credentials. |
| **Evidence** | `.env` (root, line 2-4); `backend/.env` (line 4-5). `.gitignore` excludes `.env` but the file was committed before the ignore rule. |
| **Impact** | Any person with repository access can extract API tokens. GitHub PAT grants repository access. |
| **Why It Blocks** | Cannot deploy to any shared or public environment. Security audit will fail. |
| **Required Resolution** | 1. Rotate ALL exposed tokens immediately. 2. Remove `.env` from git history (`git filter-branch` or BFG). 3. Use environment variables or a secrets manager for production. |
| **Severity** | **CRITICAL** |

---

### BLK-002: No CI/CD Pipeline

| Property | Value |
|----------|-------|
| **Phase** | Phase 24 |
| **Problem** | No `.github/workflows/`, no GitLab CI, no Jenkins, no deployment automation of any kind |
| **Evidence** | `find` search for CI/CD config files returns zero results outside `node_modules` |
| **Impact** | No automated testing on PR; no automated deployment; no quality gates |
| **Why It Blocks** | Cannot move to pilot or production without automated build/test/deploy |
| **Required Resolution** | Create GitHub Actions workflow for lint + test + build |
| **Severity** | **HIGH** |

---

### BLK-003: No Containerization

| Property | Value |
|----------|-------|
| **Phase** | Phase 24 |
| **Problem** | No Dockerfile, no docker-compose.yml, no container orchestration |
| **Evidence** | No Dockerfile or docker-compose found in entire repository |
| **Impact** | Cannot deploy reproducibly; "works on my machine" problem |
| **Why It Blocks** | Cannot deploy to staging, pilot, or production |
| **Required Resolution** | Create Dockerfile for backend; docker-compose with PostgreSQL |
| **Severity** | **HIGH** |

---

### BLK-004: No User-Facing Frontend

| Property | Value |
|----------|-------|
| **Phase** | Phase 2, Phase 3 |
| **Problem** | Web dashboard is empty (`web/` = `.gitkeep`). Android app is scaffold-only ("Hello Android"). |
| **Evidence** | `web/.gitkeep`; `MainActivity.kt` shows default Compose template |
| **Impact** | Platform has no user interface. Users cannot interact with the system. |
| **Why It Blocks** | Cannot demonstrate, pilot-test, or launch the platform |
| **Required Resolution** | Implement Hospital Dashboard (Phase 2) and Android App (Phase 3) |
| **Severity** | **CRITICAL** |

---

### BLK-005: RLS Bypass in PostgreSQL Policies

| Property | Value |
|----------|-------|
| **Phase** | Phase 1, Phase 19 |
| **Problem** | Every RLS policy includes `OR get_current_tenant_id() IS NULL`. The application layer never calls `SET LOCAL app.current_tenant_id`. This means RLS provides ZERO isolation when accessed through the application pool. |
| **Evidence** | `001_initial_schema.sql` lines 404-443: every policy has `OR get_current_tenant_id() IS NULL` fallback. `database/index.ts`: `withTenantContext()` helper exists but is NOT called in any service module. |
| **Impact** | Multi-tenant isolation relies entirely on application-layer WHERE clauses, which could be bypassed by developer error |
| **Why It Blocks** | Security audit for production readiness will fail |
| **Required Resolution** | Either: (a) integrate `withTenantContext()` into all queries, or (b) remove the `IS NULL` bypass from RLS policies |
| **Severity** | **HIGH** |

---

### BLK-006: CORS Wildcard Configuration

| Property | Value |
|----------|-------|
| **Phase** | Phase 19 |
| **Problem** | `CORS_ORIGIN=*` in both `.env` and config default. Any origin can make authenticated API requests. |
| **Evidence** | `backend/.env` line 8; `config/index.ts` line 14 |
| **Impact** | Cross-site request forgery risk; any website can call the API with user cookies |
| **Why It Blocks** | Security audit will fail |
| **Required Resolution** | Restrict CORS to specific allowed origins |
| **Severity** | **MEDIUM** |

---

### BLK-007: Registration Endpoint Has No Authorization

| Property | Value |
|----------|-------|
| **Phase** | Phase 1, Phase 19 |
| **Problem** | `POST /api/v1/auth/register` has no `authGuard` middleware. Any unauthenticated caller can create any user with any role (including SUPER_ADMIN) in any organization. |
| **Evidence** | `authRoutes.ts` line 53: `router.post('/register', async ...)` — no `authGuard` or `requirePermission` |
| **Impact** | Complete privilege escalation — anyone can create a SUPER_ADMIN account |
| **Why It Blocks** | Critical security vulnerability. Cannot deploy publicly. |
| **Required Resolution** | Add `authGuard` + `requirePermission('organization', 'create')` to register endpoint; or create a seed/bootstrap flow for initial admin |
| **Severity** | **CRITICAL** |

---

## Blocker Summary

| Severity | Count | IDs |
|----------|-------|-----|
| CRITICAL | 3 | BLK-001, BLK-004, BLK-007 |
| HIGH | 3 | BLK-002, BLK-003, BLK-005 |
| MEDIUM | 1 | BLK-006 |
| **Total** | **7** | |
