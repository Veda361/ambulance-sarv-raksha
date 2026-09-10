# Documentation vs Code Consistency

**Audit Date:** 2026-09-08

---

## Documentation Claims Feature Exists — Code Does NOT Implement It

| # | Documentation Claim | Source | Actual Code State |
|---|-------------------|--------|-------------------|
| 1 | **"React/Vite SPAs for 24/7 triage desktop and dispatch operations"** | `docs/02-architecture/system-architecture.md`, Phase 0 quality gate item 17 | `web/` directory contains only `.gitkeep`. No React, no Vite, no source code. |
| 2 | **"Android Native (Kotlin), Room DB, high-contrast single-tap ergonomics"** | ADR-007, Phase 0 quality gate item 16 | Android project is default "Hello Android" scaffold. No Room DB, no business logic. |
| 3 | **"Offline-first mobile strategy"** | ADR-007 (`ADR-007-offline-first-mobile-strategy.md`) | No offline queue, no local storage, no sync mechanism implemented. |
| 4 | **"RLS enforcement ensures tenant isolation at the database layer"** | `docs/07-phase1/multi-tenancy-implementation.md`, ADR-P1-005 | RLS policies exist but have `OR get_current_tenant_id() IS NULL` bypass. Application layer never calls `SET LOCAL app.current_tenant_id`. RLS provides zero actual isolation. |
| 5 | **"Phase 1 Quality Gate: PASSED"** | `docs/07-phase1/phase1-quality-gate.md` | Multiple quality gate items are incomplete: no CI/CD, no Docker, security gaps, RLS bypass. Quality gate report should be re-evaluated. |
| 6 | **"WebSocket topic authorization validates tenant boundaries"** | `docs/07-phase1/realtime-foundation.md` | `canSubscribe()` in `wsGateway.ts` returns `true` for all hospital and mission topics without ownership validation (lines 129-137). |
| 7 | **"Rate limiting on authentication endpoints"** | `docs/03-security/security-baseline.md` | No rate limiting middleware exists. `app.ts` has no rate-limit import or configuration. |
| 8 | **"Event architecture with persistence and replay"** | `docs/07-phase1/event-architecture.md` | `DomainEventBus` uses in-memory `EventEmitter`. No persistence. Events lost on restart. |

---

## Code Implements Feature — Documentation Does NOT Describe It

| # | Implemented Feature | Code Location | Missing Documentation |
|---|-------------------|---------------|----------------------|
| 1 | **NEWS2 Clinical Early Warning Scoring** | `clinical/news2.ts` — full 5-parameter scoring algorithm (129 lines) | No Phase 0 or Phase 1 documentation describes the NEWS2 implementation. The clinical scoring algorithm, its parameters, thresholds, and acuity levels are undocumented. |
| 2 | **Critical Vital Alert Generation** | `clinicalService.ts` L44-96 — automatic alert creation when NEWS2 ≥ 7 or red flags detected | No documentation describes the alert generation workflow or the NEWS2 → Alert pipeline. |
| 3 | **Hospital Radar WebSocket Channel** | `missionService.ts` L247-259 — broadcasts pre-arrival updates to `hospital:{id}:radar` channel | Not described in realtime documentation. |
| 4 | **Cross-Tenant Mission Envelope** | `missionService.ts` L146-155 — destination hospital's tenant can view/transition missions from other tenants | Described conceptually in ADR-002 but not in API documentation or Phase 1 docs. |
| 5 | **Dynamic ETA Calculation** | `locationService.ts` L66-91 — calculates ETA using earthdistance / speed and updates mission | No documentation describes the ETA algorithm. |
| 6 | **Telemetry Deduplication** | `locationService.ts` L22-34 — deduplicates on (mission_id, sequence_number) | Not described in IoT or telemetry documentation. |
| 7 | **Audit Log Hash Chain Verification** | `auditService.ts` L63-76 — `verifyChainIntegrity()` method | Not described in Phase 1 docs. |
| 8 | **Graceful Shutdown** | `index.ts` L23-46 — SIGTERM/SIGINT handling with 10s timeout | Not described in operational docs. |
| 9 | **PHI Redaction in Logs** | `logger.ts` L6-20 — Pino redact config for password, token, patient, phone fields | Not documented in security or privacy docs. |
| 10 | **Zero-PHI Mission Response** | `missionService.ts` L295-298 — redacts patient data for DRIVER, SUPER_ADMIN, GOVERNMENT_OPERATOR | API documentation doesn't mention response field redaction. |

---

## Severity Assessment

| Category | Count | Impact |
|----------|-------|--------|
| Docs claim exists, code doesn't | 8 | HIGH — creates false confidence in completeness |
| Code exists, docs don't describe | 10 | MEDIUM — undocumented features risk being broken by future changes |
| **Total Discrepancies** | **18** | |
