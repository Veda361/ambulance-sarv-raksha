# Phase 1 Architecture Decision Summary

**Document ID:** `docs/07-phase1/phase1-decisions.md`  
**Status:** COMPLETED / APPROVED

---

## 1. Phase 1 Technical Decision Register

| Decision ID | Area | Selected Strategy | Rationale & Trade-offs | Link to Document |
| :--- | :--- | :--- | :--- | :--- |
| **ADR-P1-001** | Backend Topology | Domain-Driven Modular Monolith | Prevents distributed saga failure modes during emergency dispatch; zero network serialization overhead. | [`ADR-P1-001`](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-P1-001-backend-modular-structure.md) |
| **ADR-P1-002** | Persistence Strategy | Native PostgreSQL 16 + SQL Migrations | Full control over PostgreSQL session context (`SET LOCAL app.current_tenant_id`) and native spatial queries. | [`ADR-P1-002`](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-P1-002-persistence-strategy.md) |
| **ADR-P1-003** | Authentication Model | Dual-Token JWT (15m Access + 7d Revocable Refresh) | Short-lived token minimizes exposure on mobile networks; instant database revocation on logout. | [`ADR-P1-003`](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-P1-003-authentication-implementation.md) |
| **ADR-P1-004** | Authorization Model | Two-Layer Server-Side RBAC (Action Gate + Context Scope Guard) | Evaluates least-privilege across 8 roles. Prevents IDOR and cross-mission manipulation. | [`ADR-P1-004`](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-P1-004-authorization-implementation.md) |
| **ADR-P1-005** | Multi-Tenancy Enforcement| Triple-Layer Defense-in-Depth (Middleware + SQL + Postgres RLS) | Kernel-level RLS prevents accidental data leaks between rival commercial ambulance operators. | [`ADR-P1-005`](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-P1-005-multi-tenant-enforcement.md) |
| **ADR-P1-006** | API Contract Strategy | URI-Path Versioning (`/api/v1/...`) with Strict DTOs | Decouples public contracts from database schemas; preserves backward compatibility for field Android apps. | [`ADR-P1-006`](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-P1-006-api-contract-strategy.md) |
| **ADR-P1-007** | Migration Strategy | Forward-Only Sequential SQL Migrations with Checksums | Guarantees atomic, versioned, reproducible database schema updates across staging and production. | [`ADR-P1-007`](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-P1-007-migration-strategy.md) |
| **ADR-P1-008** | Event Architecture | Three Distinct Event Tiers (Domain Bus, Audit Journal, Realtime) | Decouples business domain workflows from legal compliance storage and client push streams. | [`ADR-P1-008`](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-P1-008-event-strategy.md) |
| **ADR-P1-009** | Realtime Boundary | Authenticated WebSocket Gateway with Scoped Topic Subscriptions | Enforces token authentication and role checking before client topic subscription. | [`ADR-P1-009`](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-P1-009-realtime-boundary.md) |
| **ADR-P1-010** | Observability Strategy | Structured JSON (Pino) with Automated PHI Redaction + Tri-State Probes | Answers "who did what to which mission" while preventing patient medical history from leaking into logs. | [`ADR-P1-010`](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-P1-010-observability-strategy.md) |
