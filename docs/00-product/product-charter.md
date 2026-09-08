# Product Charter: Ambulance Coordination Platform (Sarv Raksha)

**Status:** PROPOSED / DRAFT (Phase 0 Architecture & Product Charter)  
**Classification Standard:** Every assertion in this document is tagged with one of: `[CONFIRMED]`, `[ASSUMPTION]`, `[PROPOSED]`, `[REQUIRES VALIDATION]`, `[UNKNOWN]`.  
**Regulatory Notice:** No legal or regulatory certifications (e.g., HIPAA, GDPR, ISO 13485, DISHA/ABDM) are claimed in Phase 0. All clinical compliance items are tagged `[REQUIRES LEGAL/COMPLIANCE REVIEW]`.

---

## 1. Product Vision
To build a resilient, real-time emergency care coordination layer that bridges the operational chasm between ambulance fleets, field crews, emergency dispatchers, and hospital emergency teams. By establishing continuous digital synchronization from initial distress call through patient handover, the platform transforms disconnected emergency response into an orchestrated continuum of care. `[CONFIRMED]`

## 2. Product Mission
To eliminate preventable delays in acute pre-hospital care and emergency handover by:
1. Providing sub-second fleet visibility and algorithmic dispatch coordination.
2. Digitizing and streaming pre-arrival clinical vitals and situational triage directly to emergency departments.
3. Guaranteeing deterministic operation across intermittent connectivity, heterogeneous hardware, and multi-tenant organizational boundaries. `[CONFIRMED]`

---

## 3. Problem Statement Overview
Pre-hospital emergency care currently suffers from structural blindness:
* **The Coordination Void:** Dispatch occurs via fragmented voice calls and unverified phone updates with zero real-time telemetry. `[CONFIRMED]`
* **The Clinical Black Hole:** Hospital emergency departments (EDs) are blind to incoming patient severity, physiological trajectory, and precise estimated time of arrival (ETA) until the physical gurney crosses the triage threshold. `[CONFIRMED]`
* **Data Disconnection:** Ambulance telematics, medical IoT telemetry (ECG, SpO2, NIBP), and crew notes exist in isolated silos or paper logs, preventing pre-hospital preparation and forensic post-incident auditing. `[CONFIRMED]`

*(Refer to [`problem-statement.md`](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/00-product/problem-statement.md) for root-cause taxonomy and deep analysis).*

---

## 4. Current-World vs. Proposed-World Workflows

```
CURRENT-WORLD (ASYMMETRIC & ANALOG)
[Emergency Call] 
       │
       ▼ (Voice phone call)
[Dispatcher] ──────> (Manual radio/phone call) ──────> [Ambulance Driver]
       │                                                      │
       │ (No real-time tracking)                              │ (Paper log / no telemetry)
       ▼                                                      ▼
[Hospital Blind] <─── (Voice call if time permits) ─── [Ambulance in Transit]
       │
       ▼ (Ambulance arrives unannounced)
[Surprise Handover] -> Delay in trauma bay / critical specialist prep -> Suboptimal Patient Outcome

────────────────────────────────────────────────────────────────────────────────────────

PROPOSED-WORLD (DIGITAL CONTINUUM)
[Emergency Request]
       │
       ▼ (Telemetry & Geo-indexed)
[Algorithmic Dispatch & Mission Engine]
       │
       ├──> [Driver Mobile]: 1-tap accept, real-time turn-by-turn turn navigation
       ├──> [EMT Mobile / IoT]: Continuous telemetry stream (SpO2, HR, BP, ECG)
       │
       ▼ (WebSocket / SSE Push)
[Receiving Hospital Emergency Department Dashboard]
       │ ──> Live GPS Breadcrumbs & Dynamic ETA
       │ ──> Pre-Arrival Early Warning Score (MEWS / NEWS2) Alerts
       │ ──> Trauma/Cath Lab Activated 15 minutes before vehicle arrival
       ▼
[Standardized Digital Handover] -> Zero-latency trauma bay admission -> Complete Auditable History
```

---

## 5. User & Customer Ecosystem

### 5.1 Customer Segments (Entities that Purchase/Sponsor)
1. **Private Hospital:** Desires captive fleet optimization, inter-facility transfer tracking, and increased catchment conversion. `[CONFIRMED]`
2. **Hospital Network:** Requires centralized multi-site visibility, inter-hospital load-balancing, and cross-facility resource governance. `[CONFIRMED]`
3. **Ambulance Operator (Commercial Fleet):** Focuses on contract SLA compliance, route efficiency, crew dispatch productivity, and billing transparency. `[CONFIRMED]`
4. **Government / EMS Authority:** Demands jurisdiction-wide incident visibility, command-and-control emergency routing, disaster triage, and public accountability metrics. `[CONFIRMED]`
5. **Independent Ambulance Fleet:** Small-scale operators needing simple mobile dispatch and automated hospital communication without enterprise IT overhead. `[CONFIRMED]`

### 5.2 Primary and Secondary Users
* **Primary (Daily Operational Loop):** Dispatcher, Driver, EMT/Nurse, Receiving Hospital Triage Team/ER Doctor. `[CONFIRMED]`
* **Secondary (Administrative & Governance):** Hospital Admin, Organization Admin, Platform Super Admin, Government/EMS Public Health Monitor. `[CONFIRMED]`

---

## 6. Value Proposition

| Stakeholder | Core Pain Point | Value Proposition Delivered |
| :--- | :--- | :--- |
| **Emergency Department (Hospital)** | Sudden arrival of critical patients without clinical context or preparation time. | 10-15 minute clinical pre-warning with streaming vitals and calibrated dynamic ETA; pre-activation of trauma teams. |
| **Ambulance Driver** | Ambiguous addresses, inefficient dispatch via voice, zero real-time navigational sync. | Single-tap mission dispatch, automated optimal routing, direct digital status transitions. |
| **EMT / Paramedic** | Dual burden of patient care and manual paper documentation while en route. | Automated sensor ingestion, structured digital pre-hospital report, direct link to receiving triage doctors. |
| **Dispatcher** | Inability to track uncommitted vs. active units; guessing nearest suitable vehicle. | Real-time geospatial fleet map, automated suitability engine, proactive SLA delay notifications. |
| **Hospital Administrator** | Inefficient fleet utilization, high turnaround time, leakage in inter-facility transfers. | End-to-end utilization analytics, SLA compliance dashboards, unified fleet-to-facility auditing. |
| **Government Authority** | Inability to audit EMS response equity, ambulance availability, or regional incident surges. | High-fidelity jurisdiction heatmap, un-tamperable audit trails, centralized emergency coordination. |

---

## 7. Core Capabilities
1. **Multi-Tenant Hierarchy & Tenant Isolation:** Strict organizational partitions with scoped cross-tenant coordination. `[CONFIRMED]`
2. **First-Class Mission Domain Engine:** Deterministic state machine governing the life of an emergency call from dispatch to sign-off. `[CONFIRMED]`
3. **Real-Time Geospatial Tracking:** High-frequency location streaming, geofencing, route deviations, and dynamic traffic-aware ETA calculation. `[CONFIRMED]`
4. **Clinical Telemetry Ingestion (Edge & IoT):** Hardware-abstracted ingestion pipeline supporting both physical monitors (via MQTT/HTTP) and simulated vitals. `[CONFIRMED]`
5. **Pre-Arrival Hospital Coordination Dashboard:** Low-latency display of approaching vehicles, incoming acuity tiers, and clinical trajectory. `[CONFIRMED]`
6. **Offline-First Crew Mobility:** Native Android caching and queueing guaranteeing zero data loss during dead-zone traversals. `[CONFIRMED]`
7. **Immutable Audit Logging:** Cryptographically anchored or tamper-evident operational logs for medicolegal record integrity. `[CONFIRMED]`

---

## 8. Product Boundaries & Non-Goals (Summary)
* **Out of Scope for System Core:** The platform is NOT a full Hospital Information System (HIS/EHR), is NOT an automated diagnostic device, and does NOT perform closed-loop autonomous medical treatment. `[CONFIRMED]`
* **Boundary Definition:** The platform's scope begins at the emergency request / dispatch trigger and concludes at the completed clinical handover and ambulance sanitization/restocking cycle. `[CONFIRMED]`
*(Refer to [`non-goals.md`](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/00-product/non-goals.md) for explicit exclusions).*

---

## 9. Foundational Product Assumptions
* `[ASSUMPTION]` Cellular connectivity (4G/LTE) is available along at least 70% of typical emergency transit corridors; short-duration dead-zones (30s–5m) are normal and must be tolerated gracefully.
* `[ASSUMPTION]` Ambulance drivers have access to standard Android hardware (Android 10+, GPS, cellular modem).
* `[ASSUMPTION]` Medical equipment in ambulances will expose standardized output (e.g., Bluetooth LE, USB/Serial, or WiFi) or feed into an intermediate IoT gateway (ESP32/STM32/Raspberry Pi).
* `[REQUIRES VALIDATION]` Field willingness of paramedics to use a mobile screen during high-stress resuscitations versus relying on automated voice/IoT telemetry.
* `[REQUIRES VALIDATION]` Specific regional medicolegal requirements for pre-hospital electronic patient care reports (ePCR) and digital signatures.

---

## 10. Major Product Risks & Mitigation Strategy

| Risk ID | Description | Severity | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **RSK-001** | Paramedic cognitive overload during active resuscitation causing data entry drop-off. | HIGH | Zero-friction UI: default to telemetry automation; minimal 1-tap state buttons; no complex text fields during active transit. |
| **RSK-002** | Cellular data blackout prevents hospital from receiving pre-arrival alerts. | HIGH | Store-and-forward SQLite queue on device; automatic failover to SMS-based critical state updates for vital milestones. |
| **RSK-003** | Inaccurate GPS / false ETAs cause hospital trauma teams to mobilize prematurely or late. | MEDIUM | Sensor fusion (GPS + accelerometer); server-side Kalman filtering; confidence intervals presented alongside raw ETA numbers. |
| **RSK-004** | Cross-tenant data leakage between rival private hospital operators sharing the platform. | CRITICAL | Logical multi-tenant schema with mandatory TenantID enforcement in row-level security and application middleware; audited isolation boundaries. |
| **RSK-005** | Delayed hospital acceptance or bed unavailability causes ambulance offload delays. | HIGH | Real-time ED diversion status flags visible to dispatchers before destination hospital lock. |
