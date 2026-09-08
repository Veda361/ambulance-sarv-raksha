# ADR-P1-001: Backend Modular Structure & Package Boundaries

**Status:** APPROVED  
**Date:** 2026-09-06  
**Deciders:** Principal Software Architect, Domain Architect, Senior Backend Architect  
**Phase:** Phase 1 — Production Engineering Foundation

---

## 1. Context
The Ambulance Coordination Platform coordinates life-critical emergency responses across dispatch, vehicle telematics, patient monitoring, and hospital handovers. In Phase 0 (ADR-001), a Decoupled Modular Monolith was approved to avoid distributed transaction failures (such as dual-write split-brain during ambulance dispatch). In Phase 1, we must formalize the concrete code directory structure, package dependency rules, and domain boundaries.

---

## 2. Problem
How should the backend codebase be structured to prevent architectural erosion, circular dependencies, and "spaghetti coupling", while ensuring that individual modules can be easily extracted into isolated services in future high-scale phases?

---

## 3. Evaluated Options
* **Option A: Traditional Layered / N-Tier Architecture (`controllers/`, `services/`, `models/`):** All models in one directory, all controllers in another. High risk of cross-domain coupling and unbounded database queries.
* **Option B: Domain-Driven Feature / Vertical Slice Modular Monolith (Recommended):** Code organized by business domains (`identity/`, `organization/`, `fleet/`, `mission/`, `clinical/`, `location/`, `audit/`). Each module contains its own domain entities, use-case services, repositories, and DTO contracts. Cross-module communication occurs strictly through public module interfaces and asynchronous domain events.
* **Option C: Micro-repo Monorepo with Nx / Turborepo:** High tooling complexity for early Phase 1.

---

## 4. Decision
**Adopt Option B: Domain-Driven Modular Monolith.**

The backend code under `backend/src/` is structured into:
1. `modules/`: Bounded contexts with private internals and public service interfaces:
   - `identity`: User accounts, password hashing, credentials.
   - `organization`: Tenants, customer categories, hospital facilities.
   - `authorization`: Server-side RBAC engine, permission evaluations.
   - `fleet`: Ambulances, capability classifications (ALS/BLS), equipment tags.
   - `crew`: Crew rosters, driver and EMT pairings, shift assignments.
   - `patient`: Patient health information (PHI) with field-level encryption.
   - `mission`: The central aggregate root, finite state machine, transitions.
   - `location`: High-frequency GPS telemetry, spatial queries, and hot cache.
   - `clinical`: Physiological vitals, time-series storage, NEWS2 scoring.
   - `alert`: Clinical deterioration and operational dispatch timeout alerts.
   - `device`: IoT gateway registry, mTLS/token auth.
   - `audit`: Append-only audit journal with cryptographic hash chaining.
2. `shared/`: Cross-cutting kernel (Domain Event Bus, Base Entity, Error classes, Result types).
3. `database/`: Migration runner, connection pool, PostgreSQL RLS session manager.
4. `realtime/`: WebSocket gateway and topic-based pub/sub broker.
5. `middleware/`: Request correlation IDs, tenant context injection, auth guards, structured logging.
6. `api/v1/`: Versioned HTTP routes, request validation, and response serialization.

---

## 5. Rationale & Consequences
* **Architectural Cleanliness:** No module may directly query another module's database tables or import internal classes.
* **Zero Distributed Latency:** In-process TypeScript calls execute in microseconds.
* **Extraction Readiness:** If the high-frequency telemetry ingestion loop requires extraction at 10,000+ active vehicles, the `location` and `clinical` modules have clean public boundaries ready for service extraction.
* **Security & Operational Impact:** Prevents cross-module data pollution. Every domain transaction is explicitly bounded.

---

## 6. Revisit Conditions
Revisit if multiple autonomous engineering squads experience merge contention or when active vehicle telemetry scale requires physical service sharding.
