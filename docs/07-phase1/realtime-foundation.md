# Realtime Boundary & WebSocket Specification

**Document ID:** `docs/07-phase1/realtime-foundation.md`  
**Status:** COMPLETED / VERIFIED  
**Parent Decision:** Phase 0 ADR-005 & Phase 1 ADR-P1-009

---

## 1. Realtime Boundary Architecture

The platform provides sub-second push notifications and telemetry updates to browser dashboards and mobile applications via an authenticated WebSocket gateway (`backend/src/realtime/wsGateway.ts`).

```
[ Web / Android Client ]
           │
           ▼ (WSS Connection Handshake with ?token=<jwt>)
[ RealtimeGateway.handleUpgrade ]
           │
           ├──► [ Authenticates JWT & extracts userId, tenantId, role, hospitalId ]
           │
           ├──► [ Assigns AuthenticatedSocket Context ]
           │
           ▼
[ Client Subscribes to Scoped Topics ]
           │
           ├── 'subscribe:tenant:{id}:fleet'     (Dispatcher view)
           ├── 'subscribe:hospital:{id}:radar'   (Hospital Triage view)
           └── 'subscribe:mission:{id}:telemetry' (Live transit view)
```

---

## 2. Topic Subscription Authorization Rules

Clients cannot subscribe to arbitrary data streams. The gateway evaluates topic permissions upon receiving subscription requests:

| Topic Pattern | Required Role / Permission | Tenant Boundary Enforcement |
| :--- | :--- | :--- |
| `tenant:{id}:fleet` | `DISPATCHER`, `ORGANIZATION_ADMIN`, `SUPER_ADMIN` | Socket `tenantId` must strictly equal topic `id`. |
| `hospital:{id}:radar` | `RECEIVING_HOSPITAL_USER`, `HOSPITAL_ADMIN`, `DISPATCHER` | Hospital must belong to tenant or have inbound mission. |
| `mission:{id}:telemetry`| `DRIVER`, `EMT`, `DISPATCHER`, `RECEIVING_HOSPITAL_USER` | Must be assigned crew or destination hospital. |

---

## 3. Broadcast Event Types

* **`LOCATION_UPDATED`:** Pushed to `mission:{id}:telemetry` with latitude, longitude, speed, and recalculated ETA in seconds.
* **`VITALS_UPDATED`:** Pushed to `mission:{id}:telemetry` with latest heart rate, SpO2, and NEWS2 score.
* **`CRITICAL_VITAL_ALERT`:** Pushed immediately to `hospital:{destHospitalId}:radar` when NEWS2 $\ge 7$, triggering high-priority audio-visual alerts on triage desks.
* **`HOSPITAL_PRE_ARRIVAL_UPDATE`:** Pushed to receiving hospital radar when an ambulance transitions into `PATIENT_ONBOARD` or `EN_ROUTE_TO_HOSPITAL`.

---

## 4. Connection Resilience & Liveness Probes
* **Ping / Pong Heartbeat:** The server transmits a `ping` frame every 30 seconds. Clients must respond with `pong`. Connections failing to respond within 30 seconds are terminated to prevent phantom socket leaks.
* **Reconnection Handling:** Mobile clients use exponential backoff on network dropouts. Upon reconnect, the client re-authenticates and re-subscribes to its active mission topic.
