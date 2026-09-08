# Non-Goals: Ambulance Coordination Platform

**Status:** APPROVED FOR PHASE 0  
**Purpose:** Establish immutable architectural boundaries and prevent scope creep, regulatory liability, and premature engineering complexity.

---

## 1. Clinical & Regulatory Non-Goals

### 1.1 Autonomous Medical Diagnosis `[EXPLICIT NON-GOAL]`
* **What is excluded:** The platform will NOT independently diagnose patient pathology (e.g., classifying a 12-lead ECG as an acute ST-Elevation Myocardial Infarction or confirming stroke type).
* **Rationale:** Autonomous diagnosis converts the software into a Class IIb / Class III Software as a Medical Device (SaMD) requiring years of clinical trials, CE mark, or FDA 510(k) clearance.
* **Architecture Boundary:** The system acts purely as a clinical telemetry relay and deterministic scoring calculator (e.g., NEWS2 rules). All diagnostic interpretation is strictly reserved for qualified medical personnel.

### 1.2 Autonomous Clinical Treatment & Drug Delivery `[EXPLICIT NON-GOAL]`
* **What is excluded:** Closed-loop medical control systems (e.g., triggering infusion pumps, defibrillator shock advice, or automated medication dosing).
* **Rationale:** Extreme life-critical liability and safety hazard.

### 1.3 Replacing Clinicians & Dispatchers `[EXPLICIT NON-GOAL]`
* **What is excluded:** Replacing human emergency call-takers, dispatchers, or triage nurses with autonomous conversational AI bots.
* **Rationale:** Human-in-the-loop oversight is mandatory for triage verification and legally accountable dispatch.

---

## 2. Product & Functional Non-Goals

### 2.1 Full Hospital Information System (HIS / EHR Replacement) `[EXPLICIT NON-GOAL]`
* **What is excluded:** Building inpatient bed management, outpatient billing ledgers, pharmacy stock management, operating theatre scheduling, or comprehensive longitudinal medical charting.
* **Rationale:** The platform is an acute pre-hospital coordination layer. Its clinical scope begins at dispatch and concludes upon signed emergency handover.

### 2.2 Complete Commercial Billing & Insurance Claims Adjudication `[EXPLICIT NON-GOAL]`
* **What is excluded:** Direct electronic claims submission to health insurance clearinghouses, dispute resolution engines, or complex consumer co-pay billing portals.
* **Rationale:** Commercial billing ecosystems vary widely by state and country. In Phase 0/MVP, the platform records operational milestones and exports auditable billing timestamps; it does not process healthcare insurance claims.

### 2.3 Direct-to-Consumer (B2C) Citizen Ride-Hailing App in MVP `[EXPLICIT NON-GOAL]`
* **What is excluded:** Building a public-facing "Uber for Ambulances" mobile consumer app in Phase 1.
* **Rationale:** Emergency dispatch is driven by emergency telephone triage (911/112/hospital helplines) or hospital inter-facility requests. Citizen hailing introduces massive prank call volumes, unverified triage, and geographic liability without vetted dispatchers.

---

## 3. Architectural & Technical Non-Goals

### 3.1 Premature Microservices Architecture `[EXPLICIT NON-GOAL]`
* **What is excluded:** Splitting the core backend into 15 independent microservices with distributed consensus, service meshes, and gRPC inter-service orchestration.
* **Rationale:** For MVP and early production, a modular monolith guarantees transactional integrity, simpler local testing, lower operational overhead, and faster development cycles. Service splitting will only occur along proven domain boundaries under extreme scale pressure.

### 3.2 Custom Proprietary Hardware Manufacturing `[EXPLICIT NON-GOAL]`
* **What is excluded:** Designing, stamping, or manufacturing proprietary vehicle telematics boxes, custom tablets, or proprietary medical sensor cables.
* **Rationale:** Hardware manufacturing is capital intensive and creates supply chain bottlenecks. The platform leverages standard Android mobile devices, commodity off-the-shelf (COTS) OBD-II GPS units, and standard Bluetooth/Serial gateways.

### 3.3 Complex Predictive AI & Machine Learning Dispatching in Phase 1 `[EXPLICIT NON-GOAL]`
* **What is excluded:** Training deep neural networks for dynamic spatial demand forecasting or neural route prediction.
* **Rationale:** Deterministic, rule-based geospatial dispatch (closest available vehicle with matching capabilities) is reliable, auditable, and easily debugged. Complex heuristic AI introduces unpredictability in emergency dispatching.

---

## 4. Scope Classification Summary Table

| Proposed Capability | Phase 1 (MVP) | Phase 2 (Production) | Phase 3 (Future) | Explicit Non-Goal |
| :--- | :---: | :---: | :---: | :---: |
| Real-time GPS Tracking & ETA | **YES** | **YES** | **YES** | No |
| Deterministic Mission State Machine | **YES** | **YES** | **YES** | No |
| Receiving Hospital Pre-Arrival Screen | **YES** | **YES** | **YES** | No |
| Automated Early Warning Scores (NEWS2) | **YES** | **YES** | **YES** | No |
| Simulated Vitals Stream | **YES** | Replaced | Replaced | No |
| Physical IoT Medical Monitor Ingestion | No | **YES** | **YES** | No |
| Enterprise Multi-Tenancy & SSO | No | **YES** | **YES** | No |
| Tamper-Evident Immutable Audit Log | No | **YES** | **YES** | No |
| Autonomous AI Medical Diagnosis | No | No | No | **PERMANENT NON-GOAL** |
| Closed-Loop Drug Infusion Control | No | No | No | **PERMANENT NON-GOAL** |
| Full Inpatient Hospital EHR / Billing | No | No | No | **PERMANENT NON-GOAL** |
| Proprietary Vehicle Hardware Design | No | No | No | **PERMANENT NON-GOAL** |
