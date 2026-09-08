# Mission State Machine Specification

**Status:** APPROVED FOR PHASE 0  
**Enforcement:** Strict finite state machine (FSM) validation. Transitions not explicitly permitted below are rejected by the backend engine with an HTTP 409 Conflict.

---

## 1. State Machine Lifecycle Diagram

```
                        ┌──────────────┐
                        │  REQUESTED   │
                        └──────┬───────┘
                               │ (Dispatcher initiates dispatch)
                               ▼
                        ┌──────────────┐
                        │ DISPATCHING  │
                        └──────┬───────┘
                               │ (Ambulance selected)
                               ▼
                        ┌──────────────┐
         ┌─────────────►│   ASSIGNED   │◄──────────────┐
         │              └──────┬───────┘               │
         │                     │                       │
         │ (Timeout/Declined)  ├───────────────────────┤ (Driver rejects)
         │                     ▼                       │
         │              ┌──────────────┐               │
         │              │   REJECTED   │───────────────┘
         │              └──────────────┘
         │                     │ (Driver taps ACCEPT)
         │                     ▼
         │              ┌──────────────┐
         │              │   ACCEPTED   │
         │              └──────┬───────┘
         │                     │ (Driver starts moving)
         │                     ▼
         │              ┌──────────────────────┐
         │              │  EN_ROUTE_TO_PICKUP  │
         │              └──────┬───────────────┘
         │                     │ (Vehicle reaches scene)
         │                     ▼
         │              ┌──────────────────────┐
         │              │    ARRIVED_PICKUP    │
         │              └──────┬───────────────┘
         │                     │ (Patient loaded / vitals connected)
         │                     ▼
         │              ┌──────────────────────┐
         │              │   PATIENT_ONBOARD    │
         │              └──────┬───────────────┘
         │                     │ (Vehicle departs for hospital)
         │                     ▼
         │              ┌──────────────────────┐
         │              │ EN_ROUTE_TO_HOSPITAL │
         │              └──────┬───────────────┘
         │                     │ (Vehicle reaches hospital bay)
         │                     ▼
         │              ┌──────────────────────┐
         │              │   ARRIVED_HOSPITAL   │
         │              └──────┬───────────────┘
         │                     │ (Patient wheeled into triage/trauma bay)
         │                     ▼
         │              ┌──────────────────────┐
         │              │       HANDOVER       │
         │              └──────┬───────────────┘
         │                     │ (Dual sign-off completed)
         │                     ▼
         │              ┌──────────────────────┐
         │              │      COMPLETED       │ [Terminal]
         │              └──────────────────────┘
         │
         ▼ (Can be cancelled from any non-terminal state by Dispatcher)
  ┌──────────────┐
  │  CANCELLED   │ [Terminal]
  └──────────────┘
```

---

## 2. Transition Rules, Actors, Events & Audit Requirements

| Current State | Target State | Authorized Actor | Triggering Action / Pre-condition | Domain Event Emitted | Notification Generated | Audit Log Required |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| *[None]* | `REQUESTED` | Dispatcher / Hospital Admin | User submits new emergency request with pickup location. | `MISSION_REQUESTED` | Internal queue push | YES (User, Time, Location) |
| `REQUESTED` | `DISPATCHING` | System / Dispatcher | System executes vehicle recommendation search. | `MISSION_DISPATCHING` | None | YES (Search criteria) |
| `DISPATCHING` | `ASSIGNED` | Dispatcher | Dispatcher confirms ambulance & crew allocation. | `MISSION_ASSIGNED` | FCM High-Priority Push to Driver Phone; Audio Chime | YES (VehicleID, DriverID) |
| `ASSIGNED` | `REJECTED` | Driver / System Timeout | Driver declines mission OR 45-second timer expires. | `MISSION_REJECTED` | Distinctive Alarm to Dispatcher Console | YES (Reason code, Elapsed seconds) |
| `REJECTED` | `ASSIGNED` | Dispatcher | Dispatcher selects alternative ambulance & crew. | `MISSION_REASSIGNED` | FCM Push to new Driver Phone | YES (Previous vehicle, New vehicle) |
| `ASSIGNED` | `ACCEPTED` | Driver | Driver taps "ACCEPT MISSION" on mobile app. | `MISSION_ACCEPTED` | WebSocket update to Dispatcher & Hospital | YES (DriverID, Device GPS) |
| `ACCEPTED` | `EN_ROUTE_TO_PICKUP` | Driver / Auto-Geofence | Driver taps "START NAVIGATION" or vehicle moves > 50m. | `MISSION_EN_ROUTE_PICKUP` | WebSocket update (Ambulance in motion) | YES (Starting GPS, Bearing) |
| `EN_ROUTE_TO_PICKUP` | `ARRIVED_PICKUP` | Driver / Auto-Geofence | Driver taps "ARRIVED SCENE" or vehicle within 50m pin. | `MISSION_ARRIVED_PICKUP` | WebSocket update to Dispatcher | YES (Arrival GPS timestamp) |
| `ARRIVED_PICKUP` | `PATIENT_ONBOARD` | Driver / EMT | EMT confirms patient loaded and initial triage recorded. | `MISSION_PATIENT_ONBOARD` | WebSocket update; Pre-arrival Radar initiated | YES (Acuity tier, EMT ID) |
| `PATIENT_ONBOARD` | `EN_ROUTE_TO_HOSPITAL`| Driver | Driver starts vehicle movement toward destination hospital. | `MISSION_EN_ROUTE_HOSPITAL`| Pre-Arrival Banner active on Receiving Hospital screen | YES (Dynamic ETA initialized) |
| `EN_ROUTE_TO_HOSPITAL`| `ARRIVED_HOSPITAL` | Driver / Auto-Geofence | Driver taps "ARRIVED HOSPITAL" or enters hospital geofence.| `MISSION_ARRIVED_HOSPITAL`| Audio Chime: "Ambulance Arrived at Bay" on ED screen | YES (Docking timestamp) |
| `ARRIVED_HOSPITAL` | `HANDOVER` | EMT / Hospital Nurse | Physical transfer in progress; ePCR summary reviewed. | `MISSION_HANDOVER_INITIATED` | Handover modal opened on triage workstation | YES (Triage bay assigned) |
| `HANDOVER` | `COMPLETED` | Hospital Nurse + EMT | Dual sign-off (Nurse accepts transfer of clinical care). | `MISSION_COMPLETED` | Resource released; vehicle returned to AVAILABLE | YES (Nurse ID, Signature Hash, Final Summary) |
| *[Any Pre-Terminal]* | `CANCELLED` | Dispatcher / Supervisor | Call cancelled by caller, duplicate call, or patient dead on arrival (DOA). | `MISSION_CANCELLED` | Driver alerted to abort; Vehicle released | YES (Mandatory cancellation reason code) |

---

## 3. Explicitly Prohibited / Invalid Transitions
The state machine rigorously enforces unidirectional forward progression. The following invalid transitions are strictly rejected:
* **Skipping Milestones:** e.g., `REQUESTED` ➔ `ARRIVED_HOSPITAL` (Rejected: vehicle cannot arrive before being assigned and accepted).
* **Backwards Transitions:** e.g., `PATIENT_ONBOARD` ➔ `EN_ROUTE_TO_PICKUP` (Rejected: physical time and travel cannot be reversed).
* **Modifying Terminal States:** No transition is permitted out of `COMPLETED` or `CANCELLED`. Once sealed, the mission is immutable.
* **Unauthorized State Forging:** A driver cannot execute the `COMPLETED` transition; only the receiving hospital triage staff or clinical supervisor can verify and seal clinical handover.

---

## 4. Timeout & Dead-Letter Handling
1. **Unacknowledged Dispatch Timeout:** When a mission enters `ASSIGNED`, a 45-second Redis countdown timer begins. If no `MISSION_ACCEPTED` event is received within 45 seconds, the state machine transitions to `REJECTED` with reason `DRIVER_TIMEOUT`, emits an audible alert to the dispatcher desk, and flags the mission for immediate re-assignment.
2. **Offline Milestone Caching:** If a driver taps a state button while traversing a cellular dead zone, the state change is recorded locally in SQLite with edge timestamp $T_{local}$. When connectivity restores, the backend evaluates transitions in sequence, maintaining valid lifecycle order.
