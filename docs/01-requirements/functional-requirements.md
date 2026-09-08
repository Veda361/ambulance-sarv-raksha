# Functional Requirements Document (FRD)

**Status:** APPROVED FOR PHASE 0  
**Priority Legend:**  
- **P0 (Must Have for MVP):** Essential for closed-loop demonstration; mission fails without it.  
- **P1 (Must Have for Production):** Essential for enterprise deployment, safety compliance, or multi-tenancy.  
- **P2 (Nice to Have / Post-Production):** Optimization, workflow acceleration, or advanced capability.

---

## 1. Fleet & Asset Management (FAM)

### FR-001: Ambulance Registration & Capability Profiling
* **Requirement:** The system shall allow an Organization Admin to register an ambulance with its vehicle registration number, chassis VIN, base station, ownership type, and capability classification (Basic Life Support [BLS], Advanced Life Support [ALS], Neonatal [NICU], Patient Transport Vehicle [PTV]).
* **Actor:** Organization Admin / Hospital Admin
* **Priority:** P0
* **Rationale:** Dispatch matching requires accurate knowledge of the clinical capability and medical equipment onboard each vehicle.
* **Dependencies:** Organization creation, User authentication.
* **Acceptance Criteria:**
  1. Admin can successfully create, update, and deactivate vehicle profiles.
  2. Vehicle capability tags directly constrain dispatch eligibility (e.g., BLS vehicle cannot be assigned to an ALS-only mission without explicit supervisor override).

### FR-002: Real-time Vehicle Status Tracking
* **Requirement:** The system shall maintain and update the operational availability status of each vehicle (`AVAILABLE`, `ASSIGNED`, `EN_ROUTE`, `ON_SCENE`, `TRANSPORTING`, `AT_HOSPITAL`, `MAINTENANCE`, `OFF_DUTY`).
* **Actor:** System / Dispatcher / Driver
* **Priority:** P0
* **Rationale:** Dispatchers must instantly filter uncommitted units from occupied or out-of-service vehicles.
* **Dependencies:** FR-001.
* **Acceptance Criteria:**
  1. Vehicle status transitions automatically upon mission lifecycle events.
  2. Dispatcher can manually toggle vehicle into `MAINTENANCE` or `OFF_DUTY` with a mandatory reason code.

---

## 2. Mission & Dispatch Management (MDM)

### FR-003: Mission Creation & Geocoded Intake
* **Requirement:** The system shall allow an authorized Dispatcher or Hospital Admin to create an emergency mission specifying caller contact, pickup latitude/longitude (or reverse-geocoded address), destination hospital, chief complaint, and initial triage urgency (Acuity 1-Red to 4-Green).
* **Actor:** Dispatcher / Hospital Admin
* **Priority:** P0
* **Rationale:** A mission is the central operational entity binding patient, vehicle, crew, and destination.
* **Dependencies:** FR-001, FR-002.
* **Acceptance Criteria:**
  1. System generates a unique, human-readable `mission_code` (e.g., `MSN-2026-00412`).
  2. Pickup coordinates are validated and pinned on the dispatch map.

### FR-004: Proximity & Capability-Based Vehicle Recommendation
* **Requirement:** The system shall calculate and rank available ambulances based on road-network or Haversine distance to pickup location and matching clinical capability.
* **Actor:** Dispatcher
* **Priority:** P0 (Simple distance in MVP; P1 road-routing).
* **Rationale:** Reduces human dispatch hesitation and minimizes response time.
* **Dependencies:** FR-002, FR-003.
* **Acceptance Criteria:**
  1. Dispatcher view presents a sorted list of candidate vehicles with estimated travel time.
  2. System flags vehicles lacking required equipment.

### FR-005: Mission Dispatch & Driver Assignment
* **Requirement:** The system shall allow the dispatcher to assign a selected ambulance and crew to a mission, transitioning the mission state to `ASSIGNED` and triggering high-priority device alerts.
* **Actor:** Dispatcher
* **Priority:** P0
* **Rationale:** Formalizes crew mobilization.
* **Dependencies:** FR-003, FR-004.
* **Acceptance Criteria:**
  1. Assigned ambulance status shifts from `AVAILABLE` to `ASSIGNED`.
  2. Device notification payload is queued and dispatched immediately.

### FR-006: Dispatch Acknowledgement & Auto-Escalation
* **Requirement:** The system shall require the assigned driver to accept or decline the mission within 45 seconds. If unacknowledged, the system shall alert the dispatcher and flag the mission for re-dispatch.
* **Actor:** Driver / System
* **Priority:** P1 (P0 manual re-assign; P1 auto-escalation timer).
* **Rationale:** Prevents abandoned calls when drivers do not see notifications.
* **Dependencies:** FR-005.
* **Acceptance Criteria:**
  1. A countdown timer displays on the driver app.
  2. On expiration without response, dispatcher dashboard sounds a distinctive "Unacknowledged Dispatch" audio alarm.

---

## 3. Driver & Navigation Workflows (DNW)

### FR-007: One-Tap Driver Mission Acceptance
* **Requirement:** The driver mobile application shall display the incoming dispatch alert with pickup address, chief complaint, and a single prominent "ACCEPT MISSION" control.
* **Actor:** Driver
* **Priority:** P0
* **Rationale:** Driver operates in motion or under extreme stress; UI must be distraction-free.
* **Dependencies:** FR-005.
* **Acceptance Criteria:**
  1. Single tap transitions mission state to `ACCEPTED` and ambulance state to `EN_ROUTE_TO_PICKUP`.
  2. App immediately launches or exposes external navigation deep-link (Google Maps intent).

### FR-008: Deterministic Milestone State Progression
* **Requirement:** The driver app shall provide sequential, unambiguous milestone buttons enabling the driver to signal: `ARRIVED_PICKUP`, `PATIENT_ONBOARD`, `ARRIVED_HOSPITAL`, and `HANDOVER_COMPLETE`.
* **Actor:** Driver
* **Priority:** P0
* **Rationale:** Creates an auditable, timestamped record of operational intervals.
* **Dependencies:** FR-007.
* **Acceptance Criteria:**
  1. Only valid sequential milestone transitions are enabled; out-of-order state triggers are blocked.
  2. Milestone timestamps are recorded with millisecond precision alongside current GPS coordinates.

---

## 4. Geospatial Tracking & Telematics (GEO)

### FR-009: Background GPS Telemetry Streaming
* **Requirement:** The driver mobile application shall capture and transmit GPS location (latitude, longitude, bearing, speed, accuracy, and UTC timestamp) at a configurable frequency (3 to 5 seconds during active transit) even when the app is in the background or the screen is locked.
* **Actor:** Driver Mobile Client / System
* **Priority:** P0
* **Rationale:** Live tracking is critical for hospital pre-arrival preparation and dynamic ETA calculation.
* **Dependencies:** FR-007.
* **Acceptance Criteria:**
  1. Background service maintains foreground notification on Android.
  2. GPS points with accuracy worse than 50 meters are flagged or filtered.

### FR-010: Dynamic ETA Calculation & Recalibration
* **Requirement:** The backend shall continuously calculate the Estimated Time of Arrival (ETA) to the destination (pickup or hospital) using current vehicle location, distance, and current speed/traffic heuristics.
* **Actor:** Backend Engine
* **Priority:** P0
* **Rationale:** Receiving hospitals need continuous, reliable countdowns to mobilize clinical teams.
* **Dependencies:** FR-009.
* **Acceptance Criteria:**
  1. ETA updates are broadcast via WebSockets on every new location ingestion or at minimum every 10 seconds.
  2. Variance between dynamic ETA and actual arrival displays within target tolerances.

---

## 5. Clinical Telemetry & Patient Monitoring (CTM)

### FR-011: Patient Profile Association
* **Requirement:** The system shall allow an EMT or Dispatcher to associate an emergency patient profile with the mission, recording Name (or "Unidentified Male/Female"), Estimated Age, Biological Sex, Trauma Mechanism, and Triage Priority.
* **Actor:** EMT / Dispatcher
* **Priority:** P0
* **Rationale:** Receiving clinical teams require demographic and physiological context.
* **Dependencies:** FR-003.
* **Acceptance Criteria:**
  1. Patient can be linked at mission creation or updated en route by the EMT.
  2. Patient record is encrypted and restricted to authorized mission participants.

### FR-012: Physiological Vitals Ingestion (Simulated in MVP, Hardware in Prod)
* **Requirement:** The system shall ingest time-series physiological vitals: Heart Rate (HR, bpm), Pulse Oximetry (SpO2, %), Non-Invasive Blood Pressure (NIBP Systolic/Diastolic, mmHg), Respiratory Rate (RR, bpm), and Temperature (°C).
* **Actor:** Simulated Telemetry Generator (MVP) / IoT Monitor Bridge (Prod)
* **Priority:** P0 (Simulated in MVP); P1 (Physical IoT).
* **Rationale:** Continuous physiological tracking detects patient collapse en route.
* **Dependencies:** FR-011.
* **Acceptance Criteria:**
  1. System ingests vitals packets at minimum every 5 seconds.
  2. Database persists historical measurements indexed by `mission_id` and `timestamp`.

### FR-013: Automated Clinical Deterioration Alerting (NEWS2 Score)
* **Requirement:** The backend shall evaluate ingested vital signs against the National Early Warning Score 2 (NEWS2) algorithm and generate critical alert events if the aggregate score exceeds 7 or any single vital reaches an extreme red trigger (e.g., SpO2 < 91% on room air, HR > 130 or < 40 bpm).
* **Actor:** Backend Rules Engine
* **Priority:** P0
* **Rationale:** Provides deterministic, objective clinical deterioration warnings to the receiving ED without clinician distraction.
* **Dependencies:** FR-012.
* **Acceptance Criteria:**
  1. Backend calculates score deterministically within 200ms of vital ingestion.
  2. Critical score triggers an `ALERT_CRITICAL_VITALS` event pushed instantly to the hospital screen.

---

## 6. Receiving Hospital Pre-Arrival Coordination (HAC)

### FR-014: Live Pre-Arrival Emergency Dashboard
* **Requirement:** The hospital web application shall render a dedicated, live-updating Pre-Arrival Triage Dashboard displaying all inbound ambulances, their active mission status, dynamic ETA countdown, patient acuity tier, and live vital trends.
* **Actor:** Receiving Hospital User (Triage Nurse / ER Doctor)
* **Priority:** P0
* **Rationale:** Gives emergency teams actionable 10-15 minute pre-warning to prepare trauma bays, assemble stroke teams, or hold CT scanners.
* **Dependencies:** FR-009, FR-010, FR-012.
* **Acceptance Criteria:**
  1. Screen updates in real-time via WebSockets without manual browser reload.
  2. High-acuity incoming patients (NEWS2 >= 7) render with high-contrast visual indicators and audible alarms.

### FR-015: Hospital Diversion & Capability Status Broadcast
* **Requirement:** The system shall allow a Hospital Admin to toggle the hospital’s operational status (`NORMAL`, `DIVERSION_TRAUMA`, `DIVERSION_ICU`, `DIVERSION_FULL`), which immediately flags the facility on the dispatch map to prevent routing to overwhelmed facilities.
* **Actor:** Hospital Admin
* **Priority:** P1
* **Rationale:** Prevents ambulances arriving at hospitals unable to render critical care.
* **Dependencies:** FR-003.
* **Acceptance Criteria:**
  1. Dispatchers are warned before selecting a diverted hospital.
  2. Diversion toggle is logged in the immutable audit history.

---

## 7. Clinical Handover & Mission Completion (HMC)

### FR-016: Structured Digital Clinical Handover Protocol
* **Requirement:** Upon arrival at the destination hospital, the system shall provide a structured handover interface displaying transit summary (total transit time, vital sign summary, treatments administered) and require dual acknowledgement (EMT sign-off and Hospital Triage Nurse sign-off).
* **Actor:** EMT & Receiving Hospital User
* **Priority:** P0 (Basic 1-click handover); P1 (Dual PIN/Digital Signature).
* **Rationale:** Medicolegal transfer of care must be unambiguously documented to prevent malpractice disputes.
* **Dependencies:** FR-008, FR-011.
* **Acceptance Criteria:**
  1. Handover cannot be executed until vehicle is physically geofenced or confirmed at the hospital.
  2. Timestamp, nurse identifier, and vital summary are sealed into an immutable handover record.

### FR-017: Mission Closure & Resource Release
* **Requirement:** Following completed handover, the system shall allow the driver to flag vehicle sanitization/restocking and return the ambulance status to `AVAILABLE`.
* **Actor:** Driver / Dispatcher
* **Priority:** P0
* **Rationale:** Closes the operational cycle and returns the vehicle to the dispatch pool.
* **Dependencies:** FR-016.
* **Acceptance Criteria:**
  1. Mission transitions to `COMPLETED`.
  2. Ambulance status returns to `AVAILABLE` for subsequent assignments.

---

## 8. Multi-Tenancy, Security & Administration (MTS)

### FR-018: Organization Partitioning & Tenant Isolation
* **Requirement:** The system shall ensure that all data queries, updates, and broadcasts are strictly scoped by the authenticated user’s `tenant_id`. Users of Tenant A shall never read or write data of Tenant B.
* **Actor:** System Security Middleware
* **Priority:** P0
* **Rationale:** Protects proprietary fleet data and confidential patient information across commercial competitors.
* **Dependencies:** Core architecture.
* **Acceptance Criteria:**
  1. Every database query enforces tenant filtering at the query or Row-Level Security layer.
  2. Automated penetration/isolation tests confirm impossible cross-tenant data access.

### FR-019: Immutable Event & Audit Logging
* **Requirement:** The system shall record an append-only, tamper-evident audit record for every mission creation, state transition, dispatch override, vital sign alert, and user login/logout event.
* **Actor:** System Audit Engine
* **Priority:** P0 (Basic event log); P1 (Tamper-evident cryptographic chaining).
* **Rationale:** Mandatory for medicolegal incident reconstruction and regulatory compliance.
* **Dependencies:** All functional modules.
* **Acceptance Criteria:**
  1. Audit entries cannot be updated or deleted via standard API endpoints (Write-Once-Read-Many).
  2. Audit logs capture timestamp, user ID, tenant ID, client IP, action name, and payload delta.
