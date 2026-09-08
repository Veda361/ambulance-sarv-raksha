# Ambulance Operations Workflow

**Status:** SUPERSEDED & ELABORATED BY PHASE 0 ARCHITECTURE  
**Canonical Specifications:**
- [Mission State Machine Specification](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/02-architecture/mission-state-machine.md)
- [Architecture Diagrams: Data Flows & Lifecycle](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/02-architecture/architecture-diagrams.md)
- [Functional Requirements: Driver & Navigation Workflows](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/01-requirements/functional-requirements.md)

---

## 1. Emergency Dispatch Lifecycle
The end-to-end lifecycle has been formalized into the 13-state deterministic Mission Finite State Machine (FSM):
1. **Incident Intake & Request:** Created by Dispatcher or Hospital Admin (`REQUESTED`).
2. **Algorithmic Vehicle Recommendation:** PostGIS spatial proximity and ALS/BLS capability matching (`DISPATCHING`).
3. **Crew Assignment & Alert:** Driver receives high-priority FCM notification and audio chime (`ASSIGNED`).
4. **Driver Acceptance:** 1-tap acceptance within a mandatory 45-second timeout window (`ACCEPTED`).
5. **Transit to Scene:** Vehicle navigates to pickup coordinates while streaming background GPS (`EN_ROUTE_TO_PICKUP`).
6. **Arrival at Scene:** Driver arrives at scene via manual tap or geofence trigger (`ARRIVED_PICKUP`).
7. **Patient Loaded & Telemetry Active:** Patient onboarded; time-series vitals ingestion starts (`PATIENT_ONBOARD`).
8. **Transit to Destination Hospital:** Vehicle en route; receiving hospital radar screen displays live dynamic ETA and NEWS2 early warning deterioration alerts (`EN_ROUTE_TO_HOSPITAL`).
9. **Emergency Bay Docking:** Ambulance enters hospital geofence; triage chime sounds on ED dashboard (`ARRIVED_HOSPITAL`).
10. **Clinical Handover & Closure:** Dual digital sign-off between EMT and Hospital Triage Nurse; mission completed and resource released (`HANDOVER` $\rightarrow$ `COMPLETED`).

---

## 2. Edge Cases & Exception Handling
- **Driver Unresponsiveness / Decline:** 45-second timer auto-escalates unacknowledged dispatch to `REJECTED` and triggers an urgent audible alert on the Dispatcher console for immediate reassignment.
- **Cellular Dead Zones (Offline Traversal):** Android client caches all milestone state transitions and GPS breadcrumbs in an encrypted local SQLite (Room) store-and-forward queue; automatically syncs on reconnect without data loss.
- **Patient Deterioration En Route:** Evaluated deterministically by the backend NEWS2 rules engine; triggers high-priority audio-visual alerts on the receiving hospital screen to pre-mobilize trauma/cath-lab teams.
- **Hospital Diversion:** Hospital capacity status (`DIVERSION_TRAUMA`, `DIVERSION_ICU`, `DIVERSION_FULL`) is broadcast live to prevent routing ambulances to overwhelmed facilities.
