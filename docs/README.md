# Ambulance Coordination Platform (Sarv Raksha) — Phase 0 Documentation Index

Welcome to the foundational Product & Architecture Charter for the Ambulance Coordination Platform. This repository contains the complete specification across product vision, requirements, systems architecture, security, role boundaries, and architectural decision records.

---

## Master Documentation Map

### 1. Product Strategy & Scope (`docs/00-product/`)
* [Product Charter](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/00-product/product-charter.md) — Product vision, mission, value propositions, and operational workflows.
* [Problem Statement](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/00-product/problem-statement.md) — Root causes vs symptoms, operational friction, and field validation needs.
* [Product Scope](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/00-product/product-scope.md) — In-scope, MVP, Post-MVP, Production, Future, and Out-of-Scope boundaries.
* [Target Customers](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/00-product/target-customers.md) — Detailed taxonomy of 5 customer segments, buyers, operators, and monetization.
* [User Personas](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/00-product/personas.md) — 8 detailed personas (Super Admin to Government Supervisor) with failure modes.
* [Business Model](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/00-product/business-model.md) — SaaS subscription tiers, feature entitlements, and government deployment.
* [MVP Definition](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/00-product/mvp-definition.md) — The unbroken Golden Path sequence and real vs. simulated matrix.
* [Production Scope](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/00-product/production-scope.md) — Enterprise HA/DR, telemetry streaming, SRE, and compliance.
* [Non-Goals](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/00-product/non-goals.md) — Explicitly prohibited features (no autonomous diagnosis, no EHR replacement).
* [Success Metrics](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/00-product/success-metrics.md) — Measurable operational, technical, and business SLOs/KPIs.

---

### 2. Requirements & Tracing (`docs/01-requirements/`)
* [Functional Requirements](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/01-requirements/functional-requirements.md) — Requirements FR-001 through FR-019 with actors, priority, and acceptance tests.
* [Non-Functional Requirements](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/01-requirements/non-functional-requirements.md) — Requirements NFR-001 through NFR-013 (Performance, Security, Reliability).
* [Assumptions Register](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/01-requirements/assumptions.md) — Explicitly labeled premises (CONFIRMED, ASSUMPTION, PROPOSED, etc.).
* [System Constraints](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/01-requirements/constraints.md) — Hardware, mobile OS, memory, and operational constraints.
* [Open Questions Register](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/01-requirements/open-questions.md) — Comprehensive analysis of foundational questions A through Z.
* [Traceability Matrix](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/01-requirements/traceability-matrix.md) — Full tracing from Business Goal to Acceptance Tests.

---

### 3. Systems Architecture (`docs/02-architecture/`)
* [System Architecture Document](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/02-architecture/system-architecture.md) — Layered topology, Modular Monolith design, and tech boundaries.
* [Domain Model](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/02-architecture/domain-model.md) — Complete specifications for all 18 core domain entities.
* [Mission State Machine](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/02-architecture/mission-state-machine.md) — 13-state deterministic lifecycle, transitions, and timeouts.
* [Architecture Diagrams](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/02-architecture/architecture-diagrams.md) — 10 Mermaid architectural diagrams (C4, data flows, boundaries).

---

### 4. Security & Privacy (`docs/03-security/`)
* [Security Baseline](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/03-security/security-baseline.md) — Authentication, mTLS, encryption at rest/transit, and secrets.
* [Privacy Requirements](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/03-security/privacy-requirements.md) — Structural PHI separation, zero PHI in logs, and data retention.
* [Threat Model](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/03-security/threat-model.md) — STRIDE analysis and critical edge/insider failure scenarios.

---

### 5. Roles & Access Control (`docs/04-roles/`)
* [Role Matrix](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/04-roles/role-matrix.md) — Hierarchical organizational boundaries and role scopes.
* [Permission Matrix](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/04-roles/permission-matrix.md) — Granular CRUD actions mapped across all platform resources.

---

### 6. Feature Matrix (`docs/05-features/`)
* [Feature Matrix](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/05-features/feature-matrix.md) — Release phasing (MVP vs Prod vs Future) and revenue relevance.

---

### 7. Architecture Decision Records (`docs/06-adrs/`)
#### Phase 0 Baseline Decisions
* [ADR-001: Modular Monolith vs Microservices](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-001-modular-monolith-vs-microservices.md)
* [ADR-002: Multi-Tenant Architecture & Data Partitioning](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-002-multi-tenant-architecture.md)
* [ADR-003: Data Ownership & Fiduciary Boundaries](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-003-data-ownership-and-tenant-isolation.md)
* [ADR-004: Mission as Central Domain Aggregate Root](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-004-mission-as-central-domain-object.md)
* [ADR-005: Realtime Transport Architecture](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-005-realtime-architecture.md)
* [ADR-006: Hardware Abstraction & IoT Ingestion](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-006-iot-ingestion-architecture.md)
* [ADR-007: Offline-First Mobile Strategy](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-007-offline-first-mobile-strategy.md)
* [ADR-008: Event History, Auditability & Medicolegal Vault](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-008-event-history-audit-strategy.md)

#### Phase 1 Engineering Foundation Decisions
* [ADR-P1-001: Backend Modular Structure](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-P1-001-backend-modular-structure.md)
* [ADR-P1-002: Persistence Strategy & Spatial Indexing](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-P1-002-persistence-strategy.md)
* [ADR-P1-003: Authentication Implementation](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-P1-003-authentication-implementation.md)
* [ADR-P1-004: Authorization & RBAC Implementation](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-P1-004-authorization-implementation.md)
* [ADR-P1-005: Multi-Tenant Enforcement Strategy](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-P1-005-multi-tenant-enforcement.md)
* [ADR-P1-006: API Contract Strategy](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-P1-006-api-contract-strategy.md)
* [ADR-P1-007: Database Migration Strategy](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-P1-007-database-migration-strategy.md)
* [ADR-P1-008: Event Strategy & Processing](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-P1-008-event-strategy.md)
* [ADR-P1-009: Realtime Boundary Implementation](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-P1-009-realtime-boundary.md)
* [ADR-P1-010: Observability Strategy](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-P1-010-observability-strategy.md)

---

### 8. Phase 1 — Production Engineering Foundation (`docs/07-phase1/`)
* [Repository Assessment](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/07-phase1/repository-assessment.md) — Comprehensive pre-implementation baseline and audit.
* [Phase 1 Architecture](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/07-phase1/phase1-architecture.md) — Deep-dive systems architecture and component boundaries.
* [Domain Implementation](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/07-phase1/domain-implementation.md) — Domain entities, lifecycles, and ownership models.
* [Database Architecture](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/07-phase1/database-architecture.md) — Relational schema, indexes, constraints, and migrations.
* [API Contracts](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/07-phase1/api-contracts.md) — Complete OpenAPI 3.1 REST specification and payload contracts.
* [Authentication & Authorization](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/07-phase1/authentication-authorization.md) — Dual-token security, Argon2id, and RBAC matrix.
* [Multi-Tenancy Implementation](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/07-phase1/multi-tenancy-implementation.md) — PostgreSQL RLS and application-layer tenant isolation.
* [Event Architecture](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/07-phase1/event-architecture.md) — Decoupled event bus, operational event store, and audit distinction.
* [Realtime Foundation](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/07-phase1/realtime-foundation.md) — Sub-second authenticated WebSocket gateway and topic authorization.
* [IoT Boundary](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/07-phase1/iot-boundary.md) — Hardware abstraction, AES-GCM security, and telemetry deduplication.
* [Observability](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/07-phase1/observability.md) — Structured logging, request correlation, health checks, and metrics.
* [Testing Strategy](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/07-phase1/testing-strategy.md) — Automated testing matrix, security simulations, and validation.
* [Development Setup](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/07-phase1/development-setup.md) — Local development guide, database setup, and environment config.
* [Phase 1 Decisions](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/07-phase1/phase1-decisions.md) — Summary of key architectural choices and trade-offs.
* [Phase 1 Definition of Done](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/07-phase1/phase1-definition-of-done.md) — Verified acceptance criteria across all categories.
* [Phase 1 Quality Gate](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/07-phase1/phase1-quality-gate.md) — Formal quality review verdict (PASS: 17/17).

---

### 9. Quality Gate Audits
* [Phase 0 Architectural Quality Gate Report](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/phase-0-quality-gate-report.md) — 26/26 verification audit criteria passed.
* [Phase 1 Production Engineering Quality Gate](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/07-phase1/phase1-quality-gate.md) — 17/17 verification audit criteria passed. Status: READY FOR PHASE 2.

