# ADR-003: Data Ownership, Fiduciary Boundaries, and Cross-Tenant Coordination

**Status:** APPROVED  
**Date:** 2026-09-06  
**Deciders:** Principal Solution Architect, Security Architect, Healthcare Compliance Advisor  
**Legal Classification:** `[REQUIRES LEGAL/COMPLIANCE REVIEW]` for statutory jurisdiction specifics.

---

## 1. Context
An emergency ambulance mission intersects multiple legally distinct entities:
- A patient (the subject of medical care and legal owner of personal health information).
- An ambulance operator (the commercial owner of the vehicle and employer of the driver).
- A hospital emergency department (the healthcare provider assuming clinical responsibility).
- A government regulator (auditing public safety response times).

Confusing data ownership causes legal disputes, prevents platform adoption, and creates severe regulatory non-compliance under national privacy laws.

---

## 2. Problem
How are data ownership boundaries, fiduciary responsibilities, and cross-organizational data sharing defined and enforced on the platform?

---

## 3. Decision
The platform establishes a **Three-Tiered Data Ownership Model** enforced through cryptographic boundaries and transient **Mission Coordination Envelopes**:

### Tier 1: Vehicular & Operational Data (Owned by Ambulance Operator)
* **Scope:** Vehicle telematics, GPS coordinates, fuel levels, OBD-II engine codes, driver shift hours, route logs, and maintenance records.
* **Ownership:** Exclusively owned by the Organization operating the ambulance.
* **Access Rules:** The receiving hospital has zero access to vehicle maintenance, driver historical routes, or other missions.

### Tier 2: Protected Health Information (Owned by Patient / Stewarded by Healthcare Provider)
* **Scope:** Patient Name, National Health ID, Age, Medical History, Chief Complaint, Ingested Vital Signs, ECG recordings, Clinical Notes, and Signed Handover summaries.
* **Fiduciary Stewardship:** Held in medical stewardship by the transporting medical organization and the receiving hospital.
* **Privacy Boundary:** Ambulance drivers, non-clinical dispatchers, and commercial fleet managers are structurally blocked from reading or exporting PHI.

### Tier 3: Macro-Operational & Public Health Telemetry (Owned by Government / Platform Governance)
* **Scope:** Anonymized emergency response intervals, regional transit heatmaps, and aggregate SLA compliance percentages.
* **Access Rules:** Government authorities access aggregated public health telemetry; individual patient records are strictly excluded.

### The Mission Coordination Envelope (Cross-Tenant Mechanism)
When Ambulance Operator A transports a patient to Hospital B:
1. The system provisions a transient **Mission Coordination Envelope**.
2. Hospital B is granted scoped, read-only WebSocket and API access to:
   - Live ambulance GPS and dynamic ETA countdown.
   - Incoming patient triage category and live vital signs.
3. Upon completion of the digital clinical handover (`MISSION_COMPLETED`), the active telemetry stream is terminated.
4. The signed handover summary is permanently archived into both Tenant A and Tenant B medicolegal record vaults.

---

## 4. Consequences
* **Positive:**
  - Clear legal compliance posture reassuring corporate hospital legal counsels.
  - Zero cross-tenant data contamination between rival operators.
  - Transparent data stewardship adhering to global healthcare data guidelines.
* **Negative:**
  - Requires additional logic in the authorization layer to evaluate dynamic mission-level delegation in addition to static tenant roles.

---

## 5. Revisit Conditions
This decision will be reviewed if local health privacy legislation enacts new statutory mandates requiring direct patient ownership tokens (e.g., patient-controlled consent artifacts under ABDM / NDHM in India).
