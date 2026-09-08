# Phase 1 Architecture: Production Engineering Foundation

**Document ID:** `docs/07-phase1/phase1-architecture.md`  
**Status:** COMPLETED / VERIFIED BY TEST SUITE  
**Architectural Style:** Decoupled Modular Monolith  
**Parent Decision:** Phase 0 ADR-001 & Phase 1 ADR-P1-001

---

## 1. System Topology Overview

Phase 1 establishes the production-grade engineering core of the Ambulance Coordination Platform. It implements a clean, decoupled **Modular Monolith** in TypeScript / Node.js backed by PostgreSQL 16 with Row-Level Security (RLS), spatial extensions (`cube`, `earthdistance`), and a persistent WebSocket boundary.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            EDGE CLIENT BOUNDARIES                               │
├─────────────────────────────────────┬───────────────────────────────────────────┤
│ Hospital Web (Triage / Admin)       │ Ambulance Android (Driver / EMT)          │
│ • Consumes versioned REST API       │ • Consumes versioned REST API             │
│ • Subscribes to hospital radar WSS  │ • Streams GPS & Vitals via HTTPS/WSS      │
│ • NEVER connects to DB directly     │ • Encrypted local SQLite store & forward  │
└──────────────────┬──────────────────┴─────────────────────┬─────────────────────┘
                   │                                        │
                   ▼ (HTTPS / WSS + Bearer JWT)             ▼ (HTTPS / WSS + Device Token)
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       INGESTION & PERIMETER MIDDLEWARE                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│ • Correlation ID Injection (X-Request-ID)                                       │
│ • Structured JSON Request Logger (Pino with automated PHI redaction)            │
│ • JWT Authentication & Token Expiry Guard                                       │
│ • Server-Side RBAC Permission Guard (hasPermission check)                       │
│ • Zod Schema Input Sanitization & Validation                                    │
└──────────────────────────────────┬──────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    MODULAR APPLICATION CORE (DOMAIN MODULES)                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌───────────────────┐ │
│ │ Identity       │ │ Organization   │ │ Authorization  │ │ Fleet & Crew      │ │
│ │ (Auth & Tokens)│ │ (Tenants/Hosps)│ │ (RBAC Engine)  │ │ (Spatial Rank)    │ │
│ └────────────────┘ └────────────────┘ └────────────────┘ └───────────────────┘ │
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌───────────────────┐ │
│ │ Mission FSM    │ │ Clinical Vitals│ │ Telemetry GPS  │ │ IoT Device Gateway│ │
│ │ (Central Root) │ │ (NEWS2 Engine) │ │ (Deduplication)│ │ (mTLS & API Keys) │ │
│ └────────────────┘ └────────────────┘ └────────────────┘ └───────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Audit Journal Module (WORM Immutable with SHA-256 Hash Chain)               │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ In-Process Domain Event Bus (Typed EventEmitter decoupling domain side-fx)  │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────┬────────────────────────────────────────┬─────────────────────┘
                   │                                        │
                   ▼                                        ▼
┌─────────────────────────────────────┐  ┌────────────────────────────────────────┐
│ REALTIME WEBSOCKET GATEWAY          │  │ PERSISTENCE & MULTI-TENANCY TIER       │
├─────────────────────────────────────┤  ├────────────────────────────────────────┤
│ • Scoped Topic Subscriptions        │  │ • PostgreSQL 16 with Connection Pool   │
│ • tenant:{id}:fleet                 │  │ • SET LOCAL app.current_tenant_id      │
│ • hospital:{id}:radar               │  │ • Row-Level Security (RLS) Policies    │
│ • mission:{id}:telemetry            │  │ • Spherical earthdistance GiST Indexes │
│ • Automatic heartbeat & disconnect  │  │ • 14 Tables, Versioned Migrations      │
└─────────────────────────────────────┘  └────────────────────────────────────────┘
```

---

## 2. Module Boundaries & Communication Rules
1. **Public Service Interfaces:** Modules expose static service methods (e.g. `MissionService.transitionState`, `IdentityService.login`, `FleetService.findNearestAvailableAmbulances`).
2. **Zero Cross-Module SQL Joins:** The `mission` module queries `missions` and joins foreign keys for response serialization, but does not mutate internal tables of `identity` or `audit`.
3. **Domain Event Decoupling:** When a state milestone transitions (e.g. `MISSION_ACCEPTED`), the Mission module does not invoke push notification libraries directly. It emits a typed `DomainEvent` on the `DomainEventBus`, allowing notification, location, and realtime listeners to react asynchronously.
4. **Authoritative Source of Truth:** Clients (web browsers, Android phones, IoT devices) are strictly untrusted edge nodes. State machine progression, dispatch allocation, and clinical calculations execute exclusively on the server.
