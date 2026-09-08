# Requirements Traceability Matrix (RTM)

**Status:** APPROVED FOR PHASE 0  
**Traceability Chain:**  
`Business Goal` ➔ `Product Requirement` ➔ `Functional Requirement (FR)` ➔ `Feature Module` ➔ `Architecture Component` ➔ `Implementation Package` ➔ `Acceptance Verification`

---

## 1. End-to-End Traceability Mappings

| Business Goal | Product Requirement | Functional Req | Feature Module | Architecture Component | Target Implementation | Acceptance Test Case |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BG-01: Reduce Pre-Hospital Emergency Response Time** | PR-01: Real-time geospatial dispatch and immediate driver alerting. | **FR-003, FR-004, FR-005, FR-007** | Dispatch & Mission Management | Dispatch Engine & Geospatial Indexer | `backend/src/modules/dispatch`, `android/app/.../driver` | **TC-DISPATCH-001:** Dispatch mission to nearest unit; verify driver notification chimes in < 3 seconds. |
| **BG-02: Eliminate Hospital Emergency Department Surprise Arrivals** | PR-02: Continuous dynamic ETA tracking and live inbound hospital radar screen. | **FR-009, FR-010, FR-014** | Hospital Pre-Arrival Coordination | Realtime WebSocket Gateway & ETA Calculator | `backend/src/modules/realtime`, `web/src/pages/hospital` | **TC-RADAR-001:** Ambulance moves towards hospital; verify ED dashboard countdown matches arrival within 2 minutes. |
| **BG-03: Accelerate Critical Resuscitation Mobilization** | PR-03: Continuous pre-hospital telemetry streaming with automated deterioration alert. | **FR-012, FR-013** | Clinical Telemetry & Triage | Telematics Ingestion & NEWS2 Rules Engine | `backend/src/modules/clinical`, `simulator/vitals` | **TC-ALERT-001:** Ingest SpO2 < 90%; verify audio-visual red alert triggers on receiving hospital screen within 1 second. |
| **BG-04: Reduce ED Offload Delays ("Wall Time")** | PR-04: Digital pre-hospital handover protocol with verified timestamped sign-off. | **FR-016, FR-017** | Handover & Closure | Handover Service & State Machine | `backend/src/modules/mission`, `web/src/components/handover` | **TC-HANDOVER-001:** Execute dual nurse-paramedic digital handover; verify vehicle returned to dispatch pool immediately. |
| **BG-05: Ensure Zero Data Loss in Intermittent Connectivity** | PR-05: Resilient offline store-and-forward edge architecture. | **FR-009, NFR-011** | Mobile Edge Resilience | SQLite Room Cache & Sync Worker | `android/app/.../data/offline` | **TC-OFFLINE-001:** Enable airplane mode for 5 minutes during transit; disable airplane mode; verify zero dropped breadcrumbs. |
| **BG-06: Guarantee Multi-Tenant Security & Privacy** | PR-06: Strict organizational data boundaries and encrypted PHI handling. | **FR-018, NFR-006, NFR-007** | Identity & Multi-Tenancy | Tenant Isolation Middleware & PostgreSQL RLS | `backend/src/modules/auth`, `backend/src/db/rls` | **TC-SECURITY-001:** Attempt cross-tenant mission query with JWT from Tenant B; assert HTTP 403 / zero rows returned. |
| **BG-07: Provide Tamper-Evident Forensic Incident History** | PR-07: Immutable append-only audit trail for all operational transitions. | **FR-019, NFR-009** | Audit & Governance | Audit Journal & Hash Chaining | `backend/src/modules/audit` | **TC-AUDIT-001:** Execute mission state changes; verify direct database UPDATE on audit table is rejected by trigger. |
| **BG-08: Maximize Fleet Capital Productivity** | PR-08: Comprehensive fleet availability tracking and duty cycle auditing. | **FR-001, FR-002** | Fleet Management | Fleet Registry & Telemetry Aggregator | `backend/src/modules/fleet` | **TC-FLEET-001:** Register new ambulance; toggle maintenance mode; verify vehicle is excluded from dispatch candidates. |
