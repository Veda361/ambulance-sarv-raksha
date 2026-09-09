# Phase 2 — Hospital Operations Platform Architecture

**Document Reference**: `docs/09-phase2/PHASE2_ARCHITECTURE.md`  
**Status**: `CONFIRMED` / Authoritative  
**Evaluated Systems**: Backend (`backend/`), Hospital Web Application (`web/`), PostgreSQL Schema (`001`, `002`), Real-time Gateway  

---

## 1. Architectural Overview

The Hospital Operations Platform operates as a **Decoupled Modular Monolith** on the backend paired with a **Single-Page Application (SPA)** on the frontend. The backend remains the authoritative source of truth for all operational states, multi-tenant boundaries, access control policies, and audit logs.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Hospital Web Application                        │
│               (React 18 + TypeScript + Vite + Leaflet)                │
│                                                                        │
│   Operations       Fleet          Mission         Inbound Radar        │
│   Dashboard      Management      Dispatching     (Receiving Triage)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST (/api/v1) + WS (/ws)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Sarv Raksha Backend (Node.js 24)                     │
│                                                                        │
│   ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────────┐   │
│   │  Auth & RBAC    │  │  Hospital Ops   │  │   Receiving Engine   │   │
│   │  (JWT + bcrypt) │  │  (KPIs/Status)  │  │   (Pre-Arrival/ETA)  │   │
│   └────────┬────────┘  └────────┬────────┘  └──────────┬───────────┘   │
│            │                    │                      │               │
│   ┌────────▼────────┐  ┌────────▼────────┐  ┌──────────▼───────────┐   │
│   │  Fleet Engine   │  │   Mission FSM   │  │   Clinical Alerting  │   │
│   │  (Nearest Havers│  │  (13 States     │  │   (NEWS2 Engine)     │   │
│   └────────┬────────┘  │   Pessimistic)  │  └──────────┬───────────┘   │
│            │           └────────┬────────┘             │               │
│   ┌────────▼────────────────────▼──────────────────────▼───────────┐   │
│   │                   Realtime WebSocket Gateway                   │   │
│   │        Topics: tenant:{id}:fleet | hospital:{id}:radar         │   │
│   └─────────────────────────────┬──────────────────────────────────┘   │
│                                 │ WORM Hash Chain Logging               │
│   ┌─────────────────────────────▼──────────────────────────────────┐   │
│   │                Cryptographic Audit Trail (SHA-256)             │   │
│   └─────────────────────────────┬──────────────────────────────────┘   │
└─────────────────────────────────┼──────────────────────────────────────┘
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      PostgreSQL 16 Storage Engine                      │
│                                                                        │
│   15 Relational Tables | Row Level Security (RLS) | Earthdistance      │
│   Immutable Audit Trigger | Idempotency Keys | Migration 001 + 002     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Pillars

### 2.1 Backend Authority Principle
The frontend NEVER dictates state. In mission progression:
```text
Hospital Web Action -> POST /api/v1/missions/:id/transition 
  -> Pessimistic Row Lock (SELECT ... FOR UPDATE)
  -> validateStateTransition(currentState, targetState, role)
  -> Update State & Linked Ambulance Status
  -> Write Immutable mission_events & audit_logs
  -> Broadcast WebSocket Event
```

### 2.2 Multi-Tenant Isolation with Destination Hospital Envelope
Organizations are isolated using two complementary layers:
1. **Application-Layer Tenant Filtering**: All service queries strictly enforce `tenant_id = $1`.
2. **PostgreSQL Row Level Security (RLS)**: Policies like `rls_missions_tenant` enforce:
   ```sql
   tenant_id = get_current_tenant_id()
   OR destination_hospital_id IN (SELECT id FROM hospitals WHERE tenant_id = get_current_tenant_id())
   ```
   This provides mathematical isolation between Hospital A and Hospital B while permitting destination hospitals to coordinate incoming transports from independent ambulance fleets.

### 2.3 Resilient Real-Time Synchronization
Realtime events supplement, but never replace, authoritative server state:
- Auto-reconnecting WebSocket client with exponential backoff and jitter.
- Server-side subscription authorization ensuring clients only listen to permitted topics.
- Client reconciliation: If a WebSocket event is delayed or out-of-order, server state takes precedence.
