# Phase 2 — Operational Workflows

**Document Reference**: `docs/09-phase2/PHASE2_OPERATIONAL_WORKFLOWS.md`  

---

## 1. Emergency Dispatch & Assignment Workflow

```text
[ Emergency Call / Incident Reported ]
                 │
                 ▼
[ Dispatcher Enters Pickup & Acuity (RED / YELLOW / GREEN) ]
                 │
                 ▼
[ System Evaluates Nearest Ambulances via Haversine Spatial Query ]
                 │
                 ▼
[ Dispatcher Selects Eligible Vehicle & Clicks 'Confirm Dispatch' ]
                 │
                 ├─► Concurrency Lock: SELECT ... FOR UPDATE on ambulance
                 ├─► Validates status == 'AVAILABLE'
                 ├─► Creates Mission in state 'REQUESTED' -> advances to 'ASSIGNED'
                 ├─► Updates Ambulance status to 'ASSIGNED'
                 ├─► Writes Immutable mission_events & audit_logs
                 └─► Broadcasts MISSION_ASSIGNED to WebSocket subscribers
```

---

## 2. Inbound Receiving Hospital Coordination Workflow

```text
[ Ambulance Leaves Scene: State becomes 'EN_ROUTE_TO_HOSPITAL' ]
                 │
                 ▼
[ Hospital Radar Broadcast: Real-time Telemetry & ETA Updates ]
                 │
                 ▼
[ Receiving Triage Staff Reviews Pre-Arrival Details & Vitals ]
                 │
                 ├─► Staff clicks 'Acknowledge Inbound'
                 │     └─► Stamps receiving_acknowledged_at
                 │
                 ├─► Staff clicks 'Mark Bay Prepared'
                 │     └─► Stamps receiving_prepared_at
                 │
                 ▼
[ Ambulance Arrives at Hospital: State becomes 'ARRIVED_HOSPITAL' ]
                 │
                 ▼
[ Clinical Handover: Staff Enters Notes & Signs Off ]
                 │
                 ▼
[ Mission Advances to 'COMPLETED', Ambulance Becomes 'AVAILABLE' ]
```
