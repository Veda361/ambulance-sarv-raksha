# Repository Assessment (Phase 1 Baseline)

**Document ID:** `docs/07-phase1/repository-assessment.md`  
**Status:** COMPLETED / BASELINE ESTABLISHED  
**Classification Standard:** Every finding is explicitly classified as `[CONFIRMED]`, `[ASSUMPTION]`, `[PROPOSED]`, `[REQUIRES VALIDATION]`, or `[UNKNOWN]`.

---

## 1. Executive Assessment Overview

Prior to commencing Phase 1 engineering implementation, a comprehensive audit of the workspace was executed. The repository was in a transitional state:
- **Phase 0 Documentation:** Complete, approved, and fully indexed in `docs/` (36 structured documents including product charter, requirements, domain model, threat model, permission matrix, and ADR-001 through ADR-008).
- **Backend Directory (`backend/`):** Contained only `.gitkeep`. No runtime code, dependencies, or database configuration had been initialized.
- **Android Directory (`android/`):** Contained a fresh, untracked Android Studio Kotlin + Jetpack Compose scaffold (`com.sarvraksha.ambulance`). No backend communication, API client, or offline database code existed yet.
- **Web Directory (`web/`):** Contained only `.gitkeep`.
- **Operating Environment:** Linux (Ubuntu 24.04), Node.js v24.13.0, npm 11.6.2, Python 3.12.3, Docker 29.8.0, and local PostgreSQL 16.14 service active.

---

## 2. Assessment Dimensions & Findings

### 2.1 Current Technology Stack
* **Runtime & Package Management:** Node.js v24.13.0 and npm 11.6.2 present. Go, pnpm, and yarn are not installed on the host. `[CONFIRMED]`
* **Database Engine:** PostgreSQL 16.14 running locally and accessible via unix domain socket/superuser. `[CONFIRMED]`
* **Mobile Runtime:** Android SDK target 37 (Android 14/15 preview), minSdk 24, Kotlin Compose BOM, Gradle 8.x. `[CONFIRMED]`
* **Containerization:** Docker Engine 29.8.0 active with running MCP support containers. `[CONFIRMED]`

### 2.2 Application Boundaries
* **Status:** In Phase 0, application boundaries were defined conceptually. In the codebase, boundaries were completely unbuilt (`backend/` and `web/` were empty). `[CONFIRMED]`
* **Boundary Rule:** The backend will serve as the sole authoritative source of truth. Mobile and web clients will never have direct database connectivity. `[CONFIRMED]`

### 2.3 Backend Architecture
* **Approved Decision (ADR-001):** Decoupled Modular Monolith. `[CONFIRMED]`
* **Implementation Stack Selection:** TypeScript / Node.js leveraging modular domain packages, strong typing, Express/Fastify-compatible architecture, and native PostgreSQL drivers. `[PROPOSED]`

### 2.4 Android Architecture
* **Current State:** Single baseline `MainActivity.kt` with Greeting composable. `[CONFIRMED]`
* **Phase 1 Objective:** Maintain current Android project without building full screens. Establish the architectural interface boundary: API DTOs, authentication token storage, error envelopes, and offline store-and-forward expectations. `[CONFIRMED]`

### 2.5 Database Approach
* **Approved Decision (ADR-002):** Single pooled database with native PostgreSQL Row-Level Security (RLS) and mandatory `tenant_id` column per tenant-scoped table. `[CONFIRMED]`
* **Schema Evolution:** 100% migration-driven. No runtime `sync()` or auto-table generation. Versioned, repeatable SQL migrations. `[CONFIRMED]`

### 2.6 API Approach
* **Contract:** Versioned RESTful API under `/api/v1/...` with explicit DTOs separating persistence models from public contracts. `[CONFIRMED]`
* **Format:** Strict JSON request/response with standardized error envelops and correlation/request IDs. `[CONFIRMED]`

### 2.7 Authentication Implementation
* **Status:** Unimplemented in code. `[CONFIRMED]`
* **Phase 0 Baseline:** OAuth 2.0 / asymmetric JWT with short-lived access tokens (15m) and rotating refresh tokens. Argon2id / bcrypt password hashing for credentials. `[CONFIRMED]`

### 2.8 Authorization Implementation
* **Status:** Unimplemented in code. `[CONFIRMED]`
* **Phase 0 Baseline:** Granular Role-Based Access Control (RBAC) supporting 8 distinct roles evaluated strictly server-side with resource-level context: $(\text{User}, \text{Tenant}, \text{Role}, \text{Resource}, \text{Action}, \text{Context})$. `[CONFIRMED]`

### 2.9 Test Setup
* **Current State:** Android unit tests (`ExampleUnitTest.kt`) present. Zero backend tests exist. `[CONFIRMED]`
* **Phase 1 Requirement:** Establish test runner (Node native test runner or Vitest/Jest) covering domain transitions, tenant isolation, RBAC, and API contracts. `[CONFIRMED]`

### 2.10 Deployment Assumptions
* **Assumption:** Local development runs against local PostgreSQL 16. Staging/Production will target containerized Kubernetes or Docker deployments. `[ASSUMPTION]`

### 2.11 Technical Debt & Architectural Violations in Existing Code
* **Assessment:** Because `backend/` was completely unstarted, there is zero legacy technical debt or pre-existing code violation. The slate is clean, permitting pure architectural compliance from line one. `[CONFIRMED]`
* **Risk to Prevent:** Bypassing tenant filtering, exposing raw DB entities through controllers, or placing business logic inside database triggers. `[CONFIRMED]`

---

## 3. Summary of Findings Classification

| Area | Finding | Classification |
| :--- | :--- | :---: |
| Host Runtime | Node.js 24 + npm 11 + Postgres 16 available | `[CONFIRMED]` |
| Backend State | Blank canvas (`backend/` empty) | `[CONFIRMED]` |
| Architecture Topology | Decoupled Modular Monolith per ADR-001 | `[CONFIRMED]` |
| Multi-Tenancy | PostgreSQL RLS + tenant-scoped repositories per ADR-002 | `[CONFIRMED]` |
| Database Target | Dedicated `sarvraksha_dev` / `sarvraksha_test` on local Postgres | `[PROPOSED]` |
| Android Scope in P1 | Boundary definition only; no complete UI screens | `[CONFIRMED]` |
| Deployment | Container-ready 12-factor application | `[ASSUMPTION]` |
