# MVP Definition: Ambulance Coordination Platform

**Status:** APPROVED FOR PHASE 0  
**Phase Target:** Phase 1 Engineering Implementation  
**Primary Goal:** Validate the end-to-end clinical and operational loop with the absolute minimum necessary architectural complexity.

---

## 1. MVP Purpose & Scope Boundary
The MVP serves as the **proof of clinical and operational synchronization**. It must conclusively demonstrate that a distress call can be converted into a structured mission, dispatched to a field driver, tracked in real-time on hospital screens, enriched with physiological telemetry, flagged with pre-hospital early warnings, and successfully handed over to receiving emergency clinicians.

It intentionally eliminates secondary enterprise features (e.g., automated billing, complex organizational hierarchies, multi-agency mutual aid) to eliminate execution risk.

---

## 2. The Core MVP Sequence (The Unbroken Golden Path)

```
[1. Hospital Admin / Dispatcher]
       │
       ▼ (Creates Mission: Pickup location, Patient initial note, Destination Hospital)
[2. Mission Created in Backend] 
       │ (State: REQUESTED -> DISPATCHING)
       ▼ (Selects available ambulance & crew)
[3. Driver Receives Push / Poll Notification on Android Device]
       │ (State: ASSIGNED)
       ▼ (Driver clicks "ACCEPT")
[4. Driver Accepts Mission]
       │ (State: ACCEPTED -> EN_ROUTE_TO_PICKUP)
       ├──> Android device initiates high-frequency GPS stream (every 3s)
       ▼
[5. Hospital Web Dashboard Reflects Ambulance in Transit]
       │ (Live marker on map, route polyline, dynamic ETA)
       ▼
[6. Driver Taps "ARRIVED PICKUP" -> "PATIENT ONBOARD"]
       │ (State: ARRIVED_PICKUP -> PATIENT_ONBOARD)
       ▼
[7. Patient Profile Attached to Mission]
       │ (Name, Age, Chief Complaint, Acuity Level)
       ▼
[8. Simulated Telemetry Engine Activated]
       │ (Generates stream: HR: 128 bpm, SpO2: 88%, NIBP: 85/55 mmHg)
       ▼
[9. Real-Time Telemetry Ingested & Evaluated by Backend]
       │ (Calculates NEWS2 Score = 8 -> High Risk Triggered)
       ▼
[10. Alert Generated & Broadcast via WebSocket]
       │ (Event: ALERT_CRITICAL_VITALS)
       ▼
[11. Receiving Hospital Screen Displays Pre-Arrival Banner]
       │ (Red high-acuity card, live vital stream, 7-minute ETA countdown)
       ▼
[12. Driver Taps "ARRIVED HOSPITAL"]
       │ (State: ARRIVED_HOSPITAL)
       ▼
[13. Handover Protocol Executed]
       │ (State: HANDOVER -> Hospital staff acknowledges handover)
       ▼
[14. Mission Marked COMPLETED]
       │ (State: COMPLETED)
       ▼
[15. Mission Event Log Sealed & Audited in History Store]
```

---

## 3. Real vs. Simulated Capabilities in MVP

To guarantee delivery velocity while proving architectural correctness, clear boundaries are established between real and simulated components:

| System Component | MVP Implementation Status | Rationale for MVP Choice |
| :--- | :--- | :--- |
| **Backend Core Engine** | **REAL** (Production-grade Node.js/TypeScript or Go Modular Monolith, PostgreSQL, Redis). | State machine, persistence, validation, and authorization must be architecturally genuine from day one. |
| **Realtime Transport** | **REAL** (Production WebSockets / Server-Sent Events). | Sub-second latency verification across mobile and web dashboards cannot be simulated. |
| **Driver Mobile App** | **REAL** (Native Android Kotlin App). | Must prove real hardware background GPS tracking, battery behavior, and driver UI ergonomics. |
| **Hospital Web Dashboard** | **REAL** (React / Vite modern SPA). | Triage doctors and nurses must interact with live map layers, audio chimes, and vital trends. |
| **Driver GPS Coordinates** | **REAL** (Native Android GPS location provider). | Must validate real-world drift, accuracy thresholds, and dead-reckoning filters. |
| **Patient Physiological Vitals** | **SIMULATED** (Software Telemetry Engine injecting realistic physiological profiles). | Interfacing physical medical monitors (Mindray, Philips) requires certified cables and hospital hardware. The ingestion pipeline must be validated via clean software generator first. |
| **Early Warning Score Logic** | **REAL** (Deterministic NEWS2 / MEWS scoring calculation algorithm running on backend). | The mathematical logic for clinical score calculation must be genuine production code. |
| **SMS Gateway Integration** | **MOCKED / SIMULATED** (Logged to terminal or local webhook viewer). | Paid third-party SMS delivery (Twilio/Gupshup) is non-critical for closed prototype testing. |
| **Turn-by-Turn Navigation** | **DEEP-LINKED** (Android opens native Google Maps intent). | Building custom embedded turn-by-turn navigation engines inside the app is unnecessary scope creep. |
| **Traffic / Dynamic ETA** | **ESTIMATED / HYBRID** (Haversine distance with average speed fallback or basic OSRM/Google Routes API). | Sufficient for prototype demonstration without incurring massive routing API costs. |
| **Multi-Tenancy** | **LOGICAL MULTI-TENANT** (Single shared database with explicit `organization_id` foreign keys and middleware validation). | Proves tenant separation without the infrastructure complexity of isolated database clusters. |
| **Payment & Billing** | **OMITTED** (Zero billing logic in MVP). | Commercial monetization is strictly post-MVP. |

---

## 4. MVP Acceptance Criteria (Definition of Done)
1. **End-to-End Execution:** A full mission can run from creation to completion across two independent physical devices (1 Android phone running the Driver App, 1 Laptop running the Hospital Web Dashboard).
2. **GPS Latency:** Location update from Android GPS to Hospital Web Map marker movement is under 2.0 seconds over 4G/LTE.
3. **State Integrity:** The mission cannot transition into invalid states (e.g., driver cannot tap `ARRIVED_HOSPITAL` while still in `DISPATCHING`).
4. **Telemetry Alerting:** When the simulated vitals generator drops SpO2 below 90% or pushes Heart Rate above 120 bpm, the Receiving Hospital Screen triggers an audible chime and visually highlights the patient card within 1.5 seconds.
5. **Zero Data Loss on Reconnect:** Simulating airplane mode on the Android device for 60 seconds during transit does not crash the app, and cached GPS points are successfully delivered upon reconnect.
