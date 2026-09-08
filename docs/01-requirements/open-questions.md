# Open Questions & Architectural Inquiry Register (Questions A–Z)

**Status:** APPROVED FOR PHASE 0  
**Classification System:**  
- `[CONFIRMED]`: Fully resolved architecture position.  
- `[ASSUMPTION]`: High-probability operational model adopted for Phase 0 design.  
- `[PROPOSED]`: Recommended technical approach pending stakeholder consensus.  
- `[REQUIRES VALIDATION]`: Needs empirical testing or client field confirmation.  
- `[UNKNOWN]`: Unresolved parameter requiring future discovery.

---

## Systematic Analysis of Foundational Architectural Questions (A–Z)

### Question A: What is the exact problem being solved?
* **Analysis & Answer:** `[CONFIRMED]` The exact problem is the operational and clinical blindness between field ambulances, emergency dispatchers, and hospital emergency departments. Pre-hospital emergency transit operates as an disconnected black box where patient condition, precise ETA, and vehicle capability are uncoordinated, leading to preventable delays in critical resuscitation and poor fleet utilization.

### Question B: Which problem is the primary problem versus secondary problems?
* **Analysis & Answer:** `[CONFIRMED]` 
  * **Primary Problem:** Real-time visibility and coordination between ambulance and hospital (sub-second GPS tracking, dynamic ETA, deterministic state transitions, and automated pre-arrival alerts).
  * **Secondary Problem:** Streaming pre-hospital clinical telemetry (vital signs, early warning scores, and digital handover records).
  * **Tertiary Problem:** Multi-tenant fleet logistics, contractual SLA auditing, and government public health analytics.

### Question C: Who pays for the platform?
* **Analysis & Answer:** `[CONFIRMED]` Payer identity depends on customer segment:
  1. *Private Hospitals & Networks:* Enterprise SaaS subscription paid by hospital administration (funded via marketing, reduced wall-time, and increased acute inpatient admissions).
  2. *Ambulance Operators:* Fleet subscription paid by fleet owners (funded by SLA compliance bonuses and reduced fuel/route leakage).
  3. *Government / EMS:* Public procurement budget or municipal health authority grant.

### Question D: Who operates the platform?
* **Analysis & Answer:** `[CONFIRMED]` The platform operating company (or SaaS vendor) operates the centralized cloud infrastructure, CI/CD, database clusters, and API gateways. Day-to-day dispatch and fleet operations are conducted independently by tenant organizations (hospital staff, operator dispatchers, or municipal call centers).

### Question E: Who owns ambulance data?
* **Analysis & Answer:** `[CONFIRMED]` The organization owning or leasing the physical ambulance owns all vehicular telematics data (GPS tracks, speed, engine status, fuel consumption, driver performance, and maintenance history).

### Question F: Who owns patient data?
* **Analysis & Answer:** `[CONFIRMED]` Patient Health Information (PHI) is owned legally by the patient and held in fiduciary stewardship by the licensed healthcare provider rendering care (the transporting hospital or the receiving hospital). Commercial ambulance operators are data processors/relays, not owners of clinical health records. `[REQUIRES LEGAL/COMPLIANCE REVIEW]`

### Question G: Which organizations can access which data?
* **Analysis & Answer:** `[CONFIRMED]` Strict isolation rules apply:
  * An ambulance operator accesses only its own vehicles, drivers, and operational timestamps.
  * A hospital accesses its captive ambulances, its own emergency missions, and incoming external ambulances *only while actively routed to its facility*.
  * Cross-tenant access is prohibited except for active mission coordination envelopes.

### Question H: Which data can cross organizational boundaries?
* **Analysis & Answer:** `[CONFIRMED]` Only a scoped, time-bound **Mission Coordination Envelope** crosses boundaries:
  1. Real-time vehicle location and ETA (visible to receiving hospital).
  2. Approaching patient triage profile and streaming vitals (visible to receiving hospital).
  3. Hospital diversion status (visible to external dispatchers).
  * *Boundary Rule:* Historical fleet operations, unrelated missions, driver personal information, and internal hospital bed management data NEVER cross boundaries.

### Question I: What information does a driver need?
* **Analysis & Answer:** `[CONFIRMED]` Minimal, high-contrast, distraction-free display:
  1. Single prominent current milestone button (Accept -> En Route -> Arrived Pickup -> Patient Onboard -> Arrived Hospital).
  2. Exact pickup and drop-off coordinates/address with 1-tap navigation launch.
  3. Single-tap emergency call button to caller/dispatcher.
  4. Assigned hospital emergency bay instructions (e.g., "Enter via Gate 2 Trauma Ramp").

### Question J: What information does an EMT need?
* **Analysis & Answer:** `[CONFIRMED]` Clinical monitoring and handover context:
  1. Patient demographic inputs and chief complaint.
  2. Live vital signs stream (HR, SpO2, NIBP, RR) and calculated NEWS2 score.
  3. Dynamic countdown ETA to the hospital door.
  4. Receiving hospital specialty readiness (e.g., "Trauma Team Activated", "Cath Lab Ready").
  5. Quick-pick intervention log (Oxygen, IV, CPR, common drugs) and digital handover sign-off.

### Question K: What information does a dispatcher need?
* **Analysis & Answer:** `[CONFIRMED]` Geospatial and status command-and-control:
  1. Live interactive map showing all fleet vehicles with real-time availability statuses.
  2. Ranked list of candidate vehicles matching required mission capability (ALS/BLS).
  3. Active mission queue with color-coded SLA timers (unacknowledged dispatch alerts).
  4. Hospital diversion warnings across the city.

### Question L: What information does a hospital administrator need?
* **Analysis & Answer:** `[CONFIRMED]` Aggregate operational and financial intelligence:
  1. Fleet utilization rates, idle hours, and maintenance turnaround.
  2. Response-time compliance distributions (dispatch-to-scene and scene-to-hospital).
  3. Average emergency room offload delay ("wall time").
  4. Volume of patients brought by hospital-owned vs. third-party ambulances.

### Question M: What information does a receiving hospital need?
* **Analysis & Answer:** `[CONFIRMED]` Clinical pre-arrival preparation data:
  1. Real-time queue of inbound ambulances with dynamic ETA countdowns.
  2. Incoming patient acuity tier, age, sex, and chief complaint.
  3. Live streaming vital signs, deterioration alerts, and 12-lead ECG traces.
  4. Specialized team mobilization requirements (Trauma, Stroke, STEMI, Sepsis).

### Question N: What information does a government/EMS authority need?
* **Analysis & Answer:** `[CONFIRMED]` Macro-level public safety oversight:
  1. Regional fleet density heatmap across municipal districts.
  2. Aggregate response time SLA compliance per contracted operator.
  3. Citywide emergency surge detection (mass casualties, outbreak clusters).
  4. Anonymized epidemiological transit volumes.

### Question O: Which workflows are safety-critical?
* **Analysis & Answer:** `[CONFIRMED]` 
  1. Emergency call dispatch and driver alert acknowledgement (preventing lost/abandoned emergencies).
  2. Hospital pre-arrival clinical alerts (timely activation of trauma and stroke teams).
  3. Clinical handover verification (preventing lost medication and intervention history).

### Question P: Which workflows are mission-critical but not clinical?
* **Analysis & Answer:** `[CONFIRMED]` 
  1. Background GPS streaming and dynamic ETA recalibration.
  2. Vehicle availability status state transitions.
  3. Driver authentication and shift check-in.
  4. Contractual milestone timestamp logging for billing.

### Question Q: Which features belong in MVP?
* **Analysis & Answer:** `[CONFIRMED]` The closed-loop single-mission lifecycle:
  * Hospital/Dispatcher mission creation.
  * Vehicle assignment & Driver mobile acceptance.
  * Real-time GPS streaming & Hospital map tracking.
  * Simulated vitals ingestion & automated NEWS2 alert generation.
  * Hospital pre-arrival notification & digital handover completion.

### Question R: Which features must exist for production?
* **Analysis & Answer:** `[CONFIRMED]` High-availability clustering, PostgreSQL Row-Level Security, physical IoT monitor ingestion, tamper-evident audit logs, offline store-and-forward mobile resilience, SAML SSO/MFA, and automated secret rotation.

### Question S: Which features must explicitly NOT be built yet?
* **Analysis & Answer:** `[CONFIRMED]` Autonomous clinical diagnosis, replacing human dispatchers, full hospital inpatient EHR/billing, proprietary hardware manufacturing, and nationwide predictive AI dispatch.

### Question T: What are the regulatory, privacy, security, and operational considerations?
* **Analysis & Answer:** `[REQUIRES LEGAL/COMPLIANCE REVIEW]` Compliance with regional health data privacy laws (DPDP / HIPAA), encryption at rest/in transit, zero PHI in logs, medical device classification boundaries (non-diagnostic), and road safety compliance for in-motion driver interfaces.

### Question U: What happens when internet connectivity fails?
* **Analysis & Answer:** `[CONFIRMED]` The mobile client enters offline mode:
  1. UI remains fully responsive; driver can still tap state milestones.
  2. All GPS coordinates, state changes, and clinical inputs are buffered in local encrypted SQLite (Room).
  3. Dynamic retry backoff drains the queue upon reconnect with zero data loss.
  4. Web dashboard displays "Last seen X minutes ago (Offline)" badge.

### Question V: What happens when GPS fails?
* **Analysis & Answer:** `[CONFIRMED]` 
  1. Android client flags GPS degradation and falls back to cell-tower / WiFi triangulation.
  2. If all location providers fail, driver app displays a clear banner prompting manual milestone confirmations.
  3. Server calculates ETA using last known location and flags ETA confidence as "DEGRADED".

### Question W: What happens when an IoT device disconnects?
* **Analysis & Answer:** `[CONFIRMED]`
  1. Backend detects missed heartbeat after 15 seconds.
  2. Vital stream on hospital dashboard flags "Sensor Disconnected - Last Reading at HH:MM:SS".
  3. EMT mobile interface displays a prompt to check sensor lead attachment or switch to manual vital entry.

### Question X: What happens when the backend is unavailable?
* **Analysis & Answer:** `[CONFIRMED]`
  1. Mobile app continues offline operation, caching all mission actions locally.
  2. Web consoles display an ambient connection warning banner ("Reconnecting to server...").
  3. Load balancers route to standby instances; if fatal, disaster recovery promotes read-replica with RTO < 15m.

### Question Y: What happens when duplicate or delayed sensor data arrives?
* **Analysis & Answer:** `[CONFIRMED]`
  1. Ingestion gateway validates every packet against `(device_id, sequence_id, timestamp)`.
  2. Duplicate packets are acknowledged and immediately dropped without reprocessing.
  3. Out-of-order packets are inserted into time-series storage chronologically based on edge timestamp, but will not regress real-time state machine indicators.

### Question Z: How should historical mission data be preserved?
* **Analysis & Answer:** `[CONFIRMED]`
  1. Operational mission summaries, milestone timestamps, and handover records are stored in PostgreSQL with write-once audit journal.
  2. Time-series GPS and vitals are archived to cold object storage (S3/MinIO) in Parquet/JSONL format after 90 days.
  3. Cryptographic hash chains ensure post-hoc forensic defensibility for 7 years. `[REQUIRES LEGAL/COMPLIANCE REVIEW]`

---

## 2. Unresolved Open Questions Requiring Field Discovery
* **OQ-001:** `[REQUIRES VALIDATION]` What percentage of target hospital emergency departments enforce mandatory hospital-wide proxy servers or firewalls that block standard persistent WebSocket connections (requiring Server-Sent Events or HTTP Long-Polling fallback)?
* **OQ-002:** `[REQUIRES VALIDATION]` Which specific physiological monitor protocols (e.g., Mindray BeneView, Philips Intellivue, HL7 over serial) dominate the target customer ambulance fleet?
* **OQ-003:** `[REQUIRES LEGAL/COMPLIANCE REVIEW]` Does the target regulatory jurisdiction legally require physical handwritten ink signatures on paper ePCR forms for trauma handover, or is a digital timestamped OTP/biometric signature fully legally recognized?
