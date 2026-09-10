# Repository Inventory

**Audit Date:** 2026-09-08  
**Branch:** `testing` (HEAD matches `main`, both at `7f7cc26`)  
**Total Commits:** 1 — `adding the main repo of android, hospital web dashboard & backend`

---

## 1. Git State

| Property | Value |
|----------|-------|
| Active Branch | `testing` |
| Remote Branches | `origin/main`, `origin/testing` |
| Total Commits | 1 |
| Untracked | `.agent/` directory (GSD tooling, not application code) |
| Dirty Working Tree | No (clean except `.agent/`) |

---

## 2. Top-Level Directory Structure

| Path | Type | Contents |
|------|------|----------|
| `android/` | Directory | Kotlin Android project (Jetpack Compose scaffold) |
| `backend/` | Directory | Node.js/TypeScript Express backend |
| `web/` | Directory | **EMPTY** — contains only `.gitkeep` |
| `docs/` | Directory | Phase 0 and Phase 1 documentation |
| `mcp_architecture/` | Directory | Single file `agents_mcp.txt` |
| `.agent/` | Directory | GSD workflow tooling (untracked) |
| `.agents/` | Directory | Agent customization |
| `.figma-images/` | Directory | Figma design assets (gitignored) |
| `.env` | File | **ROOT-LEVEL SECRETS** |
| `.gitignore` | File | Standard ignore rules |
| `README.md` | File | Project overview |

---

## 3. Backend Inventory (`backend/`)

### Source Files (31 TypeScript files)

| Category | Files |
|----------|-------|
| Entry Points | `app.ts`, `index.ts` |
| Config | `config/index.ts` |
| Database | `database/index.ts`, `database/migrate.ts` |
| Migrations | `database/migrations/001_initial_schema.sql` |
| Middleware | `authGuard.ts`, `rbacGuard.ts`, `errorHandler.ts`, `requestId.ts` |
| API Routes | `authRoutes.ts`, `orgRoutes.ts`, `fleetRoutes.ts`, `missionRoutes.ts`, `deviceRoutes.ts` |
| Modules - Identity | `identity/identityService.ts` |
| Modules - Authorization | `authorization/permissions.ts` |
| Modules - Organization | `organization/organizationService.ts` |
| Modules - Fleet | `fleet/fleetService.ts` |
| Modules - Mission | `mission/missionService.ts`, `mission/stateMachine.ts` |
| Modules - Patient | `patient/patientService.ts` |
| Modules - Clinical | `clinical/clinicalService.ts`, `clinical/news2.ts` |
| Modules - Location | `location/locationService.ts` |
| Modules - Device | `device/deviceService.ts` |
| Modules - Audit | `audit/auditService.ts` |
| Realtime | `realtime/wsGateway.ts` |
| Shared | `shared/errors.ts`, `shared/events.ts`, `shared/logger.ts` |

### Test Files (4 test files)

| File | Type |
|------|------|
| `tests/unit/missionFSM.test.ts` | Unit test |
| `tests/unit/rbac.test.ts` | Unit test |
| `tests/unit/news2.test.ts` | Unit test |
| `tests/integration/endToEndFoundation.test.ts` | Integration test |

### Dependencies

| Package | Type | Purpose |
|---------|------|---------|
| express | Runtime | HTTP framework |
| pg | Runtime | PostgreSQL driver |
| jsonwebtoken | Runtime | JWT auth |
| bcryptjs | Runtime | Password hashing |
| zod | Runtime | Schema validation |
| pino | Runtime | Structured logging |
| ws | Runtime | WebSocket server |
| dotenv | Runtime | Environment config |
| vitest | Dev | Test runner |
| supertest | Dev | HTTP test assertions |
| typescript | Dev | Type checking |
| tsx | Dev | TS execution |

### Build Configuration

| File | Purpose |
|------|---------|
| `package.json` | npm configuration |
| `package-lock.json` | Dependency lock |
| `tsconfig.json` | TypeScript configuration |
| `vitest.config.ts` | Test runner configuration |

---

## 4. Android Inventory (`android/`)

| Component | Status |
|-----------|--------|
| Build System | Gradle (Kotlin DSL) |
| Package | `com.sarvraksha.ambulance` |
| Source Files | 6 Kotlin files |
| Application Code | **MainActivity.kt ONLY** — "Hello Android" scaffold |
| Theme | 3 theme files (Color.kt, Theme.kt, Type.kt) |
| Tests | 2 scaffold test files (Example tests) |
| Custom Features | **NONE** |

---

## 5. Web/Dashboard Inventory (`web/`)

| Component | Status |
|-----------|--------|
| Files | `.gitkeep` only |
| Framework | **NOT STARTED** |
| Source Code | **NONE** |

---

## 6. Documentation Inventory (`docs/`)

| Directory | Files | Total Lines |
|-----------|-------|-------------|
| `00-product/` | 10 documents | 993 |
| `01-requirements/` | 6 documents | 629 |
| `02-architecture/` | 4 documents | 792 |
| `03-security/` | 3 documents | 209 |
| `04-roles/` | 2 documents | 161 |
| `05-features/` | 1 document | 35 |
| `06-adrs/` | 18 ADRs | 883 |
| `07-phase1/` | 16 documents | 1,144 |
| Root docs | 8 files | — |
| **TOTAL** | **68 documents** | **~4,846 lines** |

---

## 7. Infrastructure & CI/CD

| Component | Status |
|-----------|--------|
| Dockerfile | **DOES NOT EXIST** |
| docker-compose | **DOES NOT EXIST** |
| CI/CD Pipeline | **DOES NOT EXIST** (.github/workflows absent) |
| Kubernetes | **DOES NOT EXIST** |
| Terraform/IaC | **DOES NOT EXIST** |
| Monitoring | **DOES NOT EXIST** |
| Backup Scripts | **DOES NOT EXIST** |
