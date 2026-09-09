# Phase 2: Hospital Operations Platform — Pre-Implementation Architecture Audit

**Document Reference**: `docs/09-phase2/PHASE2_PREIMPLEMENTATION_AUDIT.md`  
**Execution Timestamp**: 2026-09-09T12:28:00+05:30  
**Evaluating Role**: Principal Software Architect, Security Architect, Technical Lead, Reliability Engineer  
**Repository Branch**: `faisal/branch`  
**Status**: `CONFIRMED` / Authoritative Pre-Implementation Baseline  

---

## 1. Executive Summary

This architecture audit establishes the exact current state of the **Ambulance Coordination Platform (*Sarv Raksha*)** repository following the completion and quality sign-off of Phase 1.

The objective of Phase 2 is to engineer a production-ready **Hospital Operations Platform** encompassing:
1. Secure, role-based hospital authentication and organization boundary enforcement.
2. Hospital operational dashboard and KPI telemetry.
3. Fleet management and ambulance availability tracking.
4. Concurrency-safe mission dispatch and ambulance assignment.
5. Inbound pre-arrival receiving hospital workflow coordination.
6. Real-time WebSocket synchronization with network degradation tolerance.
7. End-to-end WORM auditability, Zero-PHI access controls, and multi-tenant isolation.

**Authoritative Finding**: The Phase 1 backend foundation is sound, modular, and rigorously architected with PostgreSQL Row Level Security (RLS), a 13-state deterministic Finite State Machine (FSM), SHA-256 hash-chained WORM audit logging, spatial Haversine fleet distance queries, and WebSocket pub/sub telemetry. However, critical gaps exist:
- The frontend (`/web`) is currently empty (`.gitkeep` only).
- Missing dedicated hospital operational endpoints (KPIs, receiving hospital coordination, operational alert management, hospital profile status).
- The `listMissions` query in Phase 1 only filters by origin `tenant_id`, unintentionally blocking cross-tenant inbound missions for receiving hospitals.
- Phase 1 WebSocket topic authorization for `hospital:{id}:radar` and `mission:{id}:telemetry` was stubbed with `return true` and requires server-side tenant/role validation.
- Node runtime dependencies (`node_modules`) are not yet installed in the local environment.

---

## 2. Codebase & Directory Inventory

```text
ambulance-sarv-raksha/
├── .gitignore                      [CONFIRMED]
├── README.md                       [CONFIRMED] Overview document
├── android/                        [CONFIRMED] Kotlin Gradle project for ambulance crew client
├── backend/                        [CONFIRMED] Node.js 24 + TypeScript ESM Modular Monolith
│   ├── package.json                [CONFIRMED] express, pg, ws, zod, pino, bcryptjs, jsonwebtoken
│   ├── tsconfig.json               [CONFIRMED] NodeNext ESM configuration
│   ├── vitest.config.ts            [CONFIRMED] Unit and integration test runner
│   ├── .env.example                [CONFIRMED] Environment template
│   ├── src/
│   │   ├── app.ts                  [CONFIRMED] Express app, middleware, health probes (/health, /ready, /metrics)
│   │   ├── index.ts                [CONFIRMED] HTTP + WebSocket server startup
│   │   ├── config/index.ts         [CONFIRMED] Zod-validated environment config
│   │   ├── database/               [CONFIRMED] pg.Pool, withTransaction(), schema migrations runner
│   │   │   └── migrations/
│   │   │       └── 001_initial_schema.sql  [CONFIRMED] Authoritative 14-table DDL with RLS
│   │   ├── middleware/             [CONFIRMED] authGuard, rbacGuard, requestId, errorHandler
│   │   ├── modules/
│   │   │   ├── identity/           [CONFIRMED] User auth, bcrypt hashing, JWT access/refresh tokens
│   │   │   ├── authorization/      [CONFIRMED] Role permission matrix (8 roles, 11 resources)
│   │   │   ├── organization/       [CONFIRMED] Multi-tenant organizations and hospitals
│   │   │   ├── fleet/              [CONFIRMED] Ambulances, capability, status, spatial nearest queries, crew shifts
│   │   │   ├── mission/            [CONFIRMED] Mission aggregate, 13-state deterministic FSM
│   │   │   ├── location/           [CONFIRMED] Telemetry breadcrumbs, sequence deduplication, ETA
│   │   │   ├── patient/            [CONFIRMED] PHI storage with role-based redactions
│   │   │   ├── clinical/           [CONFIRMED] NEWS2 scoring, deterioration alert triggering
│   │   │   ├── device/             [CONFIRMED] IoT gateway boundary, HMAC validation
│   │   │   └── audit/              [CONFIRMED] Cryptographic WORM hash chain logger
│   │   ├── realtime/               [CONFIRMED] WebSocket gateway (wsGateway.ts)
│   │   └── shared/                 [CONFIRMED] RFC 7807 errors, in-memory domain eventBus, pino logger
│   └── tests/
│       ├── unit/                   [CONFIRMED] news2.test.ts, missionFSM.test.ts, rbac.test.ts
│       └── integration/            [CONFIRMED] endToEndFoundation.test.ts
├── docs/                           [CONFIRMED] 00-product through 07-phase1 architecture documentation
└── web/                            [CONFIRMED] Empty directory (.gitkeep only) — Target for Phase 2 Hospital Web
```

---

## 3. Reusable Phase 1 Components

The following Phase 1 assets are directly leveraged without breaking backward compatibility:

| Subsystem | Existing Phase 1 Implementation | Phase 2 Reuse Strategy |
|:---|:---|:---|
| **Identity & Auth** | `IdentityService`, `authGuard`, JWT with 15m expiry, 7-day SHA-256 refresh tokens | Direct reuse. Hospital users log in via `/api/v1/auth/login`. Tokens store `{ sub, tenantId, role, email, name }`. |
| **RBAC Core** | `permissions.ts`, `rbacGuard.ts` checking `(role, resource, action)` | Direct reuse with minor permission expansion for `HOSPITAL_ADMIN` fleet write permissions. |
| **Mission Aggregate & FSM** | `stateMachine.ts` with 13 states and authorized role transitions | Authoritative lifecycle engine. Frontend will query allowed transitions and never dictate states. |
| **Spatial Ranking** | `earth_distance(ll_to_earth(...))` in `FleetService.findNearestAvailableAmbulances` | Direct reuse for dispatcher ambulance suggestion and assignment. |
| **Telemetry & ETA** | `LocationService.recordLocation` with sequence deduplication and dynamic ETA | Realtime location telemetry consumed by hospital map views. |
| **NEWS2 Clinical Engine** | `calculateNEWS2()` with automatic critical alert creation | Direct reuse. Alerts displayed on hospital dashboard. |
| **WORM Audit Trail** | `AuditService.record()` with SHA-256 blockchain hash chaining + DB trigger | All Phase 2 hospital operations (dispatch, assignment, handover, alert ack) recorded directly. |
| **WebSocket Gateway** | `RealtimeGateway` with heartbeat, subscription management, broadcast | Foundation for live dashboard and radar updates. |

---

## 4. Missing Infrastructure & Gaps Identified

### 4.1 Frontend Application (`web/`)
- **Current State**: Only `.gitkeep` exists.
- **Requirement**: Modern, production-grade Hospital Web Application built with React, TypeScript, and Vite.
- **Architectural Components Required**:
  - UI Design System: Clean clinical layout, high-contrast states, WCAG 2.2 AA compliant components (Accessible modals, tables, badges, tabs, alerts).
  - Auth Provider & Session Engine: Token storage in memory with secure refresh mechanism, automatic logout on session expiration, protected route guards.
  - Operations Dashboard: Real-time KPIs, active mission lists, fleet availability status, actionable operational alerts.
  - Interactive Map Operations: Leaflet/OpenStreetMap wrapper with custom ambulance SVG markers, freshness indicators (`LIVE`, `RECENT`, `STALE`, `OFFLINE`, `UNKNOWN`), mission routes, hospital base points.
  - Mission Dispatch Workflow: Step-by-step dispatch modal validating pickup, destination hospital, required capability, nearest eligible ambulances ranking, and concurrency-safe assignment.
  - Inbound Receiving Hospital Portal: Dedicated view for inbound ambulances, ETA countdowns, pre-arrival patient summaries, handover notes, and one-click acknowledgment.
  - Alert Center: Severity-coded operational/clinical alerts with acknowledgment actions and audio-visual cues for critical events.
  - Realtime Resilient WebSocket Client: Auto-reconnecting socket with ping/pong, topic subscriptions (`tenant:{id}:fleet`, `hospital:{id}:radar`, `mission:{id}:telemetry`), and out-of-order event reconciliation.

### 4.2 Missing Backend APIs for Phase 2 Operations
- **Hospital Dashboard Overview**:
  - `GET /api/v1/hospital-ops/dashboard`: Aggregated KPIs (total ambulances, available, on-mission, maintenance; active missions by state; unacknowledged alerts count).
- **Receiving Hospital Inbound Workflow**:
  - `GET /api/v1/receiving/inbound`: Inbound ambulances heading to the user's hospital (cross-tenant accessible).
  - `POST /api/v1/receiving/:missionId/acknowledge`: Receiving hospital staff acknowledgment.
  - `POST /api/v1/receiving/:missionId/handover`: Record handover completion and notes.
- **Operational Alerts Management**:
  - `GET /api/v1/alerts`: Paginated alert query filtered by tenant, severity, acknowledgment state.
  - `POST /api/v1/alerts/:id/acknowledge`: Acknowledge actionable operational or clinical alert.
- **Hospital Fleet & Crew Management**:
  - `GET /api/v1/fleet/ambulances/:id`: Individual ambulance operational detail (assigned crew, active mission, battery/telemetry freshness).
  - `GET /api/v1/fleet/crew/available`: Active drivers and EMTs available for dispatch.
  - `GET /api/v1/hospitals/:id`: Hospital profile and operational settings.
  - `PATCH /api/v1/hospitals/:id/status`: Update hospital diversion status (`NORMAL`, `ADVISORY`, `DIVERT_ALL`, `TRAUMA_BYPASS`).
- **Audit Query**:
  - `GET /api/v1/audit-logs`: Paginated audit history for authorized hospital administrators.

### 4.3 Database Schema Enhancements (Migration `002_phase2_hospital_ops.sql`)
1. **Hospital Association on Users**:
   - Add `hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL` to `users` table so hospital-specific users (`HOSPITAL_ADMIN`, `RECEIVING_HOSPITAL_USER`, `DISPATCHER`) can be explicitly scoped to a facility.
2. **Inbound Receiving Workflow Tracking**:
   - Add columns to `missions`:
     - `receiving_acknowledged_at TIMESTAMPTZ`
     - `receiving_acknowledged_by UUID REFERENCES users(id)`
     - `receiving_prepared_at TIMESTAMPTZ`
3. **Idempotency Key Tracking Table**:
   - `idempotency_keys` table to support safe retries on mission creation, assignment, and status transitions:
     - `key VARCHAR(255) PRIMARY KEY`
     - `tenant_id UUID NOT NULL`
     - `request_path VARCHAR(255) NOT NULL`
     - `response_status INTEGER NOT NULL`
     - `response_body JSONB NOT NULL`
     - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
     - `expires_at TIMESTAMPTZ NOT NULL`
4. **Additional Indexes**:
   - `idx_missions_dest_state ON missions(destination_hospital_id, state)`
   - `idx_alerts_ack ON alerts(tenant_id, is_acknowledged, created_at)`
   - `idx_ambulances_hospital ON ambulances(hospital_id)`

---

## 5. Architectural & Security Risk Analysis

### 5.1 Cross-Tenant Mission Isolation vs Inbound Hospital Access
- **Risk**: In Phase 1, `MissionService.listMissions` queried `WHERE m.tenant_id = $1`. When Hospital A (Organization A) receives an inbound patient from Ambulance B (Organization B, an independent ambulance fleet), Hospital A's dispatchers could not see the incoming mission in standard lists.
- **Resolution**: Update mission listing to query:
  `WHERE (m.tenant_id = $1 OR m.destination_hospital_id IN (SELECT id FROM hospitals WHERE tenant_id = $1))`
  This aligns with PostgreSQL RLS policy `rls_missions_tenant` established in Phase 1.

### 5.2 Realtime Subscription Authorization
- **Risk**: `wsGateway.ts` had permissive placeholders for `hospital:{id}:radar` and `mission:{id}:telemetry` (`return true`).
- **Resolution**: Implement strict verification:
  - `hospital:{id}:radar`: User's tenant must own the hospital or user must be assigned to that hospital.
  - `mission:{id}:telemetry`: User's tenant must match mission tenant OR destination hospital tenant.

### 5.3 Hospital Administrator Fleet Permissions
- **Risk**: Phase 1 `permissions.ts` granted `HOSPITAL_ADMIN` only `ambulance: ['read']`, while Section 7 of Phase 2 requires Hospital Administrators to manage their hospital ambulance fleet.
- **Resolution**: Update `PERMISSIONS.HOSPITAL_ADMIN.ambulance` to `['create', 'read', 'update']` constrained to ambulances assigned to their facility.

### 5.4 Zero-PHI Exposure Boundary
- **Confirmed Phase 1 Rule**: Drivers, Super Admins, and Regulators must NEVER receive PHI (`patient_name`, `patient_complaint`, `vital_measurements`).
- **Phase 2 Enforcement**: Hospital Web UI will conditionally render patient details based on user role (`HOSPITAL_ADMIN`, `DISPATCHER`, `EMT`, `RECEIVING_HOSPITAL_USER` have operational PHI access; `DRIVER` has Zero PHI).

---

## 6. Execution Order & Next Steps

1. **Architecture Documentation & ADRs**:
   - Establish `docs/09-phase2/` suite (`PHASE2_ARCHITECTURE.md`, `PHASE2_REQUIREMENTS.md`, `PHASE2_API_CONTRACT.md`, `PHASE2_SECURITY_MODEL.md`, `PHASE2_DECISIONS.md`).
2. **Database Migration `002_phase2_hospital_ops.sql`**:
   - Add user hospital binding, receiving workflow fields, idempotency key table, and performance indexes.
3. **Backend Domain & API Enhancements**:
   - Implement `HospitalOpsService`, `ReceivingService`, `AlertService`, idempotency middleware, and expanded endpoints under `/api/v1/`.
4. **Hospital Web Application (`web/`)**:
   - Scaffold React + TypeScript + Vite single-page application with modular architecture, resilient WebSocket hook, Leaflet mapping, operations dashboard, dispatch flow, and receiving portal.
5. **Comprehensive Verification**:
   - Unit tests, integration tests, concurrency tests, and end-to-end operational flow verification.
