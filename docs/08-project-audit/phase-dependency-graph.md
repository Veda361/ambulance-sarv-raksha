# Phase Dependency Graph

**Audit Date:** 2026-09-08

---

## Sequential Phase Dependencies

```
Phase 0: Product & Architecture Charter [COMPLETE]
    │
    ▼
Phase 1: Production Engineering Foundation [IMPLEMENTED_NOT_PRODUCTION_READY]
    │
    ├───────────────────────────────────────────────────┐
    ▼                                                   ▼
Phase 2: Hospital Dashboard [NOT_STARTED]    Phase 3: Android App [NOT_STARTED]
    │                                                   │
    │                                                   ▼
    │                                        Phase 4: GPS [PARTIAL - backend only]
    │                                                   │
    ├───────────────────────────────────────────────────┤
    ▼                                                   ▼
Phase 5: Mission Dispatch [PARTIAL]          Phase 11: Offline Mobile [NOT_STARTED]
    │
    ├──────────────┬─────────────────┐
    ▼              ▼                 ▼
Phase 6:       Phase 7:          Phase 8:
Patient/       IoT              Realtime
Clinical       [PARTIAL]        [PARTIAL]
[PARTIAL]          │                 │
    │              │                 │
    ▼              ▼                 ▼
Phase 9: Hospital Pre-Arrival [PARTIAL]
    │
    ▼
Phase 10: Notifications [NOT_STARTED]
    │
    ▼
Phase 12: Fleet Management [PARTIAL]
    │
    ▼
Phase 13: Advanced Dispatch [NOT_STARTED]
    │
    ├──────────────────────────┐
    ▼                          ▼
Phase 14:                  Phase 15:
Government                 Analytics
[NOT_STARTED]              [NOT_STARTED]
    │                          │
    ▼                          ▼
Phase 16: Subscription/Billing [NOT_STARTED]
    │
    ▼
Phase 17-18: External API + Device Mgmt [NOT_STARTED / PARTIAL]
    │
    ▼
Phase 19-25: Security / Reliability / Observability / Testing / Infra / Compliance
    │           [NOT_STARTED to PARTIAL]
    ▼
Phase 26: Pilot Deployment [NOT_STARTED]
    │
    ▼
Phase 27: Production Launch Readiness [NOT_STARTED]
    │
    ▼
Phase 28: Production Launch [NOT_STARTED]
    │
    ▼
Phase 29: Post-Launch [NOT_APPLICABLE]
    │
    ▼
Phase 30: Scale / Multi-Region [NOT_APPLICABLE]
```

---

## Actual Technology Dependency Chain

```
PostgreSQL + Extensions (uuid-ossp, earthdistance, cube)
    │
    ▼
Schema Migration (001_initial_schema.sql)
    │
    ▼
Database Layer (pg Pool + withTransaction + withTenantContext)
    │
    ├──────────────────┬──────────────────────────────────┐
    ▼                  ▼                                  ▼
Identity           Organization                      Audit
(bcrypt, JWT)      (CRUD, Hospitals)                 (SHA-256 chain)
    │                  │                                  │
    ▼                  ▼                                  │
Auth Guard         Fleet Service                         │
(JWT verify)       (Ambulances, Crew, Spatial)           │
    │                  │                                  │
    ▼                  ▼                                  │
RBAC Guard ───▶ Mission Service ◀─── Patient Service    │
                  │                    │                  │
                  ▼                    ▼                  │
              State Machine       Clinical Service       │
              (13-state FSM)      (NEWS2, Alerts)        │
                  │                    │                  │
                  ├────────────────────┤                  │
                  ▼                                      │
              Location Service                           │
              (GPS, ETA, Dedup)                          │
                  │                                      │
                  ▼                                      │
              Device Service ◀───────────────────────────┘
              (IoT Auth, Telemetry)
                  │
                  ▼
              WebSocket Gateway
              (Realtime Broadcast)
                  │
                  ▼
              Express App
              (API Routes, Error Handler)
                  │
                  ▼
              HTTP Server
```

---

## Critical Path to Production

```
[NOW] Fix secrets exposure in .env ──▶ Docker containerization
    │                                        │
    ▼                                        ▼
CI/CD Pipeline ──▶ Security Headers ──▶ Rate Limiting
    │                                        │
    ▼                                        ▼
Hospital Dashboard (Phase 2) ──▶ Android App (Phase 3)
    │                                   │
    ▼                                   ▼
Integration Testing ──▶ Pilot Deployment (Phase 26)
```
