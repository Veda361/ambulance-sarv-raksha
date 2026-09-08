# User Personas: Ambulance Coordination Platform

**Status:** APPROVED FOR PHASE 0  
**Classification System:** `[CONFIRMED]`, `[ASSUMPTION]`, `[PROPOSED]`.

---

## 1. Persona 1: Platform Super Admin (System & Infrastructure Custodian)
* **Archetype:** Lead DevOps / Platform Engineer at the platform operating company.
* **Goals:** Maintain 99.95% system uptime, ensure multi-tenant security isolation, monitor global API latency, and provision new customer tenants cleanly. `[CONFIRMED]`
* **Responsibilities:**
  - Tenant lifecycle management (onboarding, suspension, quota allocation).
  - Global system health monitoring, infrastructure scaling, and secret management.
  - Investigating cross-tenant security anomalies and database performance bottlenecks.
* **Workflow:** Accesses internal Super Admin console -> inspects tenant resource usage -> reviews dead-letter queues and error rates -> manages feature flags.
* **Information Needs:** Realtime system health metrics, tenant storage/throughput consumption, platform error logs, database replication lag.
* **Permissions:** Global READ across system metadata, tenant management write permissions. **Explicitly RESTRICTED from viewing decrypted Patient Health Information (PHI)** to maintain zero-trust privacy boundaries. `[CONFIRMED]`
* **Risks:** Misconfiguration affecting all tenants; accidental global database migration disruption.
* **Failure Scenarios:** Bad infrastructure deployment causing platform-wide WebSocket disconnect during active emergency responses.
* **Success Criteria:** Platform MTTR < 15 minutes; zero cross-tenant data leaks; 100% tenant provisioning automation.

---

## 2. Persona 2: Organization Admin (Enterprise Fleet/Healthcare Manager)
* **Archetype:** Director of Operations at an Ambulance Operating Company or Corporate Hospital Network.
* **Goals:** Optimize fleet utilization, ensure contractual SLA compliance, oversee staff credentialing, and control operating expenditures. `[CONFIRMED]`
* **Responsibilities:**
  - Managing organizational assets: ambulances, medical equipment, and IoT gateways.
  - Managing organization user accounts, roles, and shift assignments.
  - Reviewing monthly SLA reports, fuel utilization, and response time metrics.
* **Workflow:** Logs into Organization Portal -> audits daily active fleet count -> reviews response-time exceptions -> manages driver rosters and certifications.
* **Information Needs:** Aggregate fleet status, historical mission completion stats, SLA breach alerts, crew roster status, billing/subscription usage.
* **Permissions:** Full administrative control within their specific `tenant_id` (create/update ambulances, users, locations, view organization-level audit logs). Zero access to other tenants.
* **Risks:** Inadvertently assigning an uncertified driver or out-of-service vehicle to an active dispatch pool.
* **Failure Scenarios:** Delay in revoking access of a terminated driver who retains mobile app credentials.
* **Success Criteria:** 100% of fleet assets digitized; zero uncertified crew dispatched; accurate monthly billing data.

---

## 3. Persona 3: Hospital Admin (Facility & Emergency Department Lead)
* **Archetype:** Emergency Department Nursing Director / Chief Medical Officer of a participating hospital.
* **Goals:** Eliminate ambulance offload delays ("wall time"), maximize trauma and cardiac team readiness, and track facility-assigned captive ambulances. `[CONFIRMED]`
* **Responsibilities:**
  - Managing hospital emergency department profiles (trauma level, specialized services like Cath Lab, Stroke, Pediatric).
  - Setting and updating hospital diversion status (e.g., ICU Full, CT Scanner Down).
  - Reviewing pre-hospital triage accuracy and hospital-door-to-intervention times.
* **Workflow:** Morning review of incoming emergency volumes -> verification of ED trauma bay capacity -> updating hospital operational readiness status.
* **Information Needs:** Real-time incoming ambulance count, ETA countdowns, incoming patient acuity distribution, emergency department bed/equipment readiness status.
* **Permissions:** Read/Write within the scope of their assigned `hospital_id`; view all missions bound for or originating from their facility; update facility capability flags.
* **Risks:** Failure to signal emergency diversion, causing inbound ambulances carrying critical patients to arrive at an overstretched facility.
* **Failure Scenarios:** Hospital dashboard freezes unnoticed during a multi-trauma incident.
* **Success Criteria:** Zero unannounced critical trauma arrivals; 25% reduction in ED offload delays.

---

## 4. Persona 4: Emergency Dispatcher (Operational Mission Controller)
* **Archetype:** Fast-paced emergency coordination specialist operating the CAD/dispatch desk.
* **Goals:** Assign the fastest, most clinically appropriate ambulance to an emergency distress call in under 60 seconds. `[CONFIRMED]`
* **Responsibilities:**
  - Ingesting emergency requests (caller location, chief complaint, triage priority).
  - Selecting available vehicle and crew based on spatial proximity, equipment type (ALS vs. BLS), and traffic conditions.
  - Monitoring active missions from dispatch until hospital handover, intervening if delays occur.
* **Workflow:** Ingests call -> inputs pickup address & urgency -> views candidate ambulances ranked by ETA -> clicks "Dispatch" -> tracks driver acceptance countdown -> monitors transit on map.
* **Information Needs:** Real-time vehicle GPS positions and availability statuses (AVAILABLE, BUSY, EN_ROUTE, MAINTENANCE), live traffic layers, driver response timeouts.
* **Permissions:** Create and modify missions within their organization; assign/re-assign ambulances and crew; cancel or re-route missions; override vehicle recommendations.
* **Risks:** High cognitive stress leading to incorrect address entry or dispatching an unequipped vehicle to a cardiac arrest.
* **Failure Scenarios:** Driver does not acknowledge dispatch, and dispatcher misses the timeout notification while handling another emergency call.
* **Success Criteria:** Average time to dispatch < 60 seconds; driver acknowledgement < 45 seconds; zero unacknowledged dispatch timeouts.

---

## 5. Persona 5: Ambulance Driver (Field Navigation & Vehicle Operator)
* **Archetype:** Professional vocational driver operating under high stress, intense traffic, and siren noise.
* **Goals:** Receive clear, unambiguous pickup and destination coordinates, navigate via optimal routes safely, and update mission milestones with zero distraction. `[CONFIRMED]`
* **Responsibilities:**
  - Acknowledging dispatch alerts within 30 seconds.
  - Navigating safely to the scene and subsequent destination hospital.
  - Transitioning mission states (`ACCEPTED`, `EN_ROUTE_TO_PICKUP`, `ARRIVED_PICKUP`, `EN_ROUTE_TO_HOSPITAL`, `ARRIVED_HOSPITAL`).
* **Workflow:** Audible alert sounds on mounted Android device -> taps giant "ACCEPT" button -> follows turn-by-turn navigation -> taps "ARRIVED SCENE" -> assists loading -> follows navigation to hospital -> taps "ARRIVED HOSPITAL".
* **Information Needs:** Clear destination pin, fastest traffic-aware route, caller contact button, destination hospital gate/bay entrance notes, current mission state.
* **Permissions:** View only the currently active assigned mission; execute state transitions for that mission; stream background GPS location. No access to other missions or hospital administrative views.
* **Risks:** Distracted driving from complicated software interfaces; losing cellular signal in rural pockets; accidental double-tapping of state buttons.
* **Failure Scenarios:** Phone battery dies or app crashes in background, stopping GPS transmission to the hospital.
* **Success Criteria:** 1-tap state transitions; 100% background GPS transmission uptime; zero app crashes during active driving.

---

## 6. Persona 6: EMT / Paramedic / Flight Nurse (Clinical Field Caregiver)
* **Archetype:** High-skill emergency medical clinician administering ALS/BLS protocols inside a moving, unstable ambulance cabin.
* **Goals:** Stabilize the patient, monitor physiological trends, prepare the receiving medical team, and execute a fast, error-free clinical handover. `[CONFIRMED]`
* **Responsibilities:**
  - Assessing initial patient acuity and entering basic triage parameters.
  - Connecting patient to physiological monitors (ECG, SpO2, NIBP) or verifying telemetry streaming.
  - Recording critical interventions (e.g., intubation, IV access, drugs administered) en route.
  - Executing digital clinical handover with the receiving ED charge nurse.
* **Workflow:** Assesses patient on scene -> confirms "Patient Onboard" -> attaches sensors -> views streaming vitals on tablet -> logs administered drug via quick-pick button -> signs off handover at ED bay.
* **Information Needs:** Real-time patient vital sign trends, calculated Early Warning Scores (NEWS2/MEWS), receiving hospital specialist readiness, remaining transit ETA.
* **Permissions:** Create/edit patient profile associated with their assigned mission; record vital signs and clinical interventions; view destination hospital capability; execute handover sign-off.
* **Risks:** Manual data entry during severe patient resuscitation; physical turbulence making typing impossible.
* **Failure Scenarios:** Telemetry monitor disconnects unnoticed while clinician is focused on chest compressions.
* **Success Criteria:** 90%+ telemetry continuity; pre-arrival alert transmitted to hospital at least 10 minutes prior to arrival; zero documentation loss.

---

## 7. Persona 7: Receiving Hospital User (Emergency Triage Nurse / Trauma Attending)
* **Archetype:** High-stress emergency clinician stationed at the ER triage desk or trauma resuscitation bay.
* **Goals:** Anticipate incoming high-acuity patients, prepare surgical/resuscitation teams prior to arrival, and complete rapid, informed triage without repeating tests. `[CONFIRMED]`
* **Responsibilities:**
  - Monitoring the live pre-arrival ED dashboard for incoming ambulances.
  - Reviewing pre-arrival vital trends, ECG rhythm strips, and chief complaints.
  - Pre-allocating trauma bays, alerting on-call specialists (e.g., Cath Lab, Neuro-interventionalist), and preparing blood products.
  - Receiving the physical patient and completing the digital handover protocol.
* **Workflow:** Audio alert chimes on ED dashboard -> views incoming vehicle with critical NEWS2 score (>7) and ETA 8 mins -> clicks "Activate Trauma Team" -> ambulance arrives -> accepts digital handover with 1-click pin/signature.
* **Information Needs:** Incoming vehicle list, dynamic ETA countdown, patient age/gender, chief complaint, live vitals trend, critical flags (e.g., "STEMI Alert", "Intubated"), assigned bay.
* **Permissions:** View pre-arrival and active mission data for all ambulances routed to their specific hospital; acknowledge and sign off clinical handover; mark hospital diversion status.
* **Risks:** Alert fatigue from false alarms; missing a sudden vital collapse due to a cluttered dashboard UI.
* **Failure Scenarios:** ED user unaware of an approaching ambulance because dashboard required manual browser refresh.
* **Success Criteria:** Sub-2-second notification latency from ambulance update to hospital screen; zero unexpected high-acuity arrivals; 100% digital handover compliance.

---

## 8. Persona 8: Government / EMS Authority Operator (Jurisdiction Supervisor)
* **Archetype:** Public health oversight director or municipal emergency operations center (EOC) watchstander.
* **Goals:** Ensure public health safety, enforce ambulance response time standards across operators, and manage regional disaster response. `[CONFIRMED]`
* **Responsibilities:**
  - Auditing regional emergency response times and fleet density across city sectors.
  - Detecting coverage gaps in rural or underserved districts.
  - Coordinating multi-agency ambulance deployment during mass-casualty incidents (MCIs), floods, or major industrial events.
* **Workflow:** Observes regional jurisdiction heatmap -> reviews aggregated response-time SLA reports -> initiates regional mutual-aid broadcast if localized fleet saturation occurs.
* **Information Needs:** High-level anonymized fleet heatmaps, active emergency incident counts, aggregate operator response times, regional hospital bed diversion statuses.
* **Permissions:** Read-only access to anonymized regional fleet locations, incident volumes, and aggregated response statistics across all licensed operators in their jurisdiction. **Strictly prohibited from viewing individual patient identifiable data (PHI) unless legally designated in mass-casualty emergency modes.** `[REQUIRES LEGAL/COMPLIANCE REVIEW]`
* **Risks:** Regulatory overreach into private operator proprietary data; unauthorized access to civilian tracking.
* **Failure Scenarios:** System fails to aggregate cross-operator data during a municipal disaster, blinding public emergency commanders.
* **Success Criteria:** Comprehensive jurisdiction-wide situational awareness; automated objective monthly SLA auditing; rapid disaster mutual-aid activation.
