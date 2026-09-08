# System Requirements Overview

**Status:** SUPERSEDED & ELABORATED BY PHASE 0 ARCHITECTURE  
**Canonical Specifications:**
- [Functional Requirements Document (FR-001 to FR-019)](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/01-requirements/functional-requirements.md)
- [Non-Functional Requirements Document (NFR-001 to NFR-013)](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/01-requirements/non-functional-requirements.md)
- [Role & Permission Matrix](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/04-roles/permission-matrix.md)
- [Explicit Non-Goals](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/00-product/non-goals.md)

---

## 1. Functional Requirements Summary
* **Fleet Management (FR-001 to FR-002):** Vehicle registration, clinical capability tagging (ALS, BLS, NICU, PTV), and real-time operational status transitions (`AVAILABLE`, `ASSIGNED`, `MAINTENANCE`, `OFF_DUTY`).
* **Mission & Dispatch (FR-003 to FR-006):** Geocoded incident intake, algorithmic vehicle ranking, high-priority driver push alerting, and automated 45-second dispatch unacknowledged timeout escalation.
* **Driver & Mobile Workflows (FR-007 to FR-008):** 1-tap dispatch acceptance, turn-by-turn navigation deep-linking, and deterministic milestone progression (`ACCEPTED`, `EN_ROUTE_PICKUP`, `ARRIVED_PICKUP`, `PATIENT_ONBOARD`, `EN_ROUTE_HOSPITAL`, `ARRIVED_HOSPITAL`).
* **Geospatial & Telematics (FR-009 to FR-010):** Foreground background GPS streaming (3-5s intervals) and server-side dynamic ETA recalibration.
* **Clinical Telemetry & Triage (FR-011 to FR-013):** Patient profile association, continuous vital signs ingestion (simulated in MVP, physical IoT in Production), and deterministic NEWS2 early warning clinical degradation alerting.
* **Hospital Pre-Arrival (FR-014 to FR-015):** Live receiving hospital radar screen with audio-visual alerts and hospital diversion status broadcast.
* **Handover & Closure (FR-016 to FR-017):** Dual-confirmation digital handover protocol and instant vehicle return to the dispatch pool.
* **Multi-Tenancy & Governance (FR-018 to FR-019):** Strict tenant isolation and tamper-evident append-only audit logging.

---

## 2. Non-Functional Requirements Summary
* **Performance (NFR-001 to NFR-002):** Sub-second realtime distribution (< 500ms P95); core API response time < 200ms P95.
* **Availability & Reliability (NFR-003 to NFR-004):** 99.95% availability SLA; RPO $\le$ 1 minute; automated RTO $\le$ 15 minutes.
* **Scalability (NFR-005):** Ingestion architecture capable of sustaining 5,000 events/sec across 10,000 active ambulances.
* **Security & Privacy (NFR-006 to NFR-008):** Mandatory TLS 1.3, AES-256 at rest, zero-trust PostgreSQL Row-Level Security (RLS), and automated redaction of PHI from application logs.
* **Offline Resilience (NFR-011):** 120-minute offline operation with store-and-forward SQLite queue on Android.

---

## 3. User Roles & Boundary Reconciliation
* **Supported Roles:** Platform Super Admin, Organization Admin, Hospital Admin, Emergency Dispatcher, Ambulance Driver, EMT/Paramedic, Receiving Hospital User, Government/EMS Operator.
* **Scope Reconciliation & Non-Goal Conflict Note:** The placeholder in legacy documents referenced a direct "Patient/Citizen" role for self-booking. As formalized in [Non-Goals](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/00-product/non-goals.md), building a direct consumer "Uber for Ambulances" hailing app is an explicit non-goal for MVP/Phase 1. Citizen distress requests are ingested via emergency dispatchers or hospital intake coordinators to prevent prank calls, unverified triage, and acute emergency liability.
