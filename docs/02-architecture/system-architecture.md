# System Architecture Document

**Status:** APPROVED FOR PHASE 0  
**Architectural Style:** Event-Driven Modular Monolith (Transitioning to Scaled Ingestion Sidecars at High Load)  
**Primary Core Decision:** ADR-001 (Modular Monolith vs. Microservices)

---

## 1. Architectural Philosophy & Guiding Principles

The system architecture is designed around four foundational constraints:
1. **Determinism in Life-Critical Pathways:** State transitions, dispatch assignments, and clinical alerts must execute deterministically with predictable sub-second latency.
2. **Resilience to Network Chaos:** Edge clients (mobile and IoT) operate under intermittent connectivity; the architecture embraces store-and-forward queueing and idempotent event ingestion.
3. **Strict Multi-Tenancy & Zero-Trust Privacy:** Data isolation is enforced natively at the database and middleware layers. Protected Health Information (PHI) is isolated from operational fleet data.
4. **Avoid Premature Distributed Complexity:** A clean, decoupled **Modular Monolith** with an asynchronous event bus provides maximum velocity, transactional integrity, and operational simplicity for MVP and initial enterprise scaling, avoiding the operational failure modes of premature microservices.

---

## 2. Layered Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 1. EDGE & CLIENT TIER                                                           │
│ ┌──────────────────────┐ ┌──────────────────────┐ ┌───────────────────────────┐ │
│ │ Ambulance Android App│ │ Hospital Web Portal  │ │ Admin & Gov Web Console   │ │
│ │ (Kotlin, Room SQLite)│ │ (React / Vite SPA)   │ │ (React / Vite SPA)        │ │
│ └──────────┬───────────┘ └──────────▲───────────┘ └─────────────▲─────────────┘ │
│            │ (HTTPS / WSS)          │ (WSS / HTTPS)             │ (HTTPS)       │
├────────────┼────────────────────────┼───────────────────────────┼───────────────┤
│ 2. INGESTION & GATEWAY TIER         │                           │               │
│ ┌──────────▼────────────────────────┴───────────────────────────┴─────────────┐ │
│ │ API Gateway / Reverse Proxy (Traefik / Nginx / Envoy)                       │ │
│ │ • SSL/TLS 1.3 Termination  • Rate Limiting  • Tenant ID Header Validation   │ │
│ └───────────────────────────────────┬─────────────────────────────────────────┘ │
│                                     │                                           │
├─────────────────────────────────────┼───────────────────────────────────────────┤
│ 3. CORE PLATFORM (MODULAR MONOLITH) │                                           │
│ ┌───────────────────────────────────▼─────────────────────────────────────────┐ │
│ │ APPLICATION CORE (Node.js/TypeScript or Go Modular Engine)                  │ │
│ │                                                                             │ │
│ │ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────────┐ │ │
│ │ │ Identity &    │ │ Organization  │ │ Fleet &       │ │ Dispatch Engine   │ │ │
│ │ │ Auth (OAuth2) │ │ Management    │ │ Telematics    │ │ (Geospatial Match)│ │ │
│ │ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────────┘ │ │
│ │ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────────┐ │ │
│ │ │ Mission State │ │ Clinical &    │ │ Pre-Arrival & │ │ Notification &    │ │ │
│ │ │ Machine Engine│ │ Patient Vitals│ │ Hospital Triage│ │ Alert Dispatcher  │ │ │
│ │ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────────┘ │ │
│ │ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────────┐ │ │
│ │ │ IoT & Hardware│ │ Immutable     │ │ Analytics &   │ │ Subscription &    │ │ │
│ │ │ Bridge Module │ │ Audit Journal │ │ Reporting     │ │ Feature Gates     │ │ │
│ │ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────────┘ │ │
│ │                                                                             │ │
│ │ ────────────── In-Process Asynchronous Domain Event Bus ─────────────────── │ │
│ └───────────────────────────────────┬─────────────────────────────────────────┘ │
├─────────────────────────────────────┼───────────────────────────────────────────┤
│ 4. REALTIME & MESSAGING BACKBONE    │                                           │
│ ┌───────────────────────────────────▼─────────────────────────────────────────┐ │
│ │ Distributed Realtime Backplane (Redis Pub/Sub Cluster / NATS Core)          │ │
│ │ • WebSocket Session Coordination  • Dynamic Geofencing  • Ingest Buffer     │ │
│ └───────────────────────────────────┬─────────────────────────────────────────┘ │
├─────────────────────────────────────┼───────────────────────────────────────────┤
│ 5. DATA PERSISTENCE & STORAGE TIER  │                                           │
│ ┌───────────────────────────────────▼─────────────────────────────────────────┐ │
│ │ Primary Relational DB: PostgreSQL 16+ with PostGIS                          │ │
│ │ • Multi-Tenant Row-Level Security (RLS)  • ACID Transactional Consistency   │ │
│ │ Time-Series & Metrics: TimescaleDB Extension                                │ │
│ │ • Continuous GPS Breadcrumbs & High-Frequency Vital Telemetry               │ │
│ │ Object Storage: S3 / MinIO (Encrypted at rest)                              │ │
│ │ • 12-Lead ECG PDF Strips, Clinical Handover Signatures, Medicolegal Vault   │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Subsystem Breakdown

### 3.1 Edge Clients
1. **Ambulance Mobile (Android Native):**
   - Built in Kotlin with native Android Architecture Components (Coroutines, Flow, Room DB).
   - Manages foreground GPS tracking service with battery optimization.
   - Enforces offline store-and-forward queueing; all state transitions and telemetry are committed to local SQLite before network transmission.
   - Communicates via WebSocket with automatic fallback to HTTPS REST.
2. **Hospital Web Portal (React / Vite SPA):**
   - High-performance web single-page application built for 24/7 desktop triage screens.
   - Subscribes to hospital-scoped WebSocket channel for real-time incoming ambulance radar, dynamic ETA countdowns, and vital alerts.
   - Zero installation overhead; operates securely on standard hospital evergreen browsers.
3. **Dispatcher & Admin Web Portal (React / Vite SPA):**
   - Interactive GIS map view displaying fleet status, candidate recommendations, and active mission queues.
   - Real-time SLA monitoring counters and dispatch override controls.
4. **Hardware / IoT Gateways (Edge Microcontrollers):**
   - In-vehicle gateway (ESP32 / STM32 / Raspberry Pi CM4) interfacing OBD-II CAN bus and medical monitor serial ports.
   - Transmits telemetry over MQTT or HTTP to backend ingestion endpoints with hardware TLS client certificates (mTLS).

---

### 3.2 Platform Core Modules (The Modular Monolith)
The backend is structured into strictly decoupled domain modules communicating via defined internal service interfaces and asynchronous domain events:

* **Identity & Authentication Module:** Handles JWT token issuance, session refresh, MFA enforcement, and SSO federation (SAML/OIDC).
* **Organization & Multi-Tenancy Module:** Enforces tenant boundaries, hospital facility groupings, and organizational role assignments.
* **Fleet Management Module:** Maintains vehicle registries, operational statuses, equipment profiles (ALS/BLS), and hardware device pairings.
* **Dispatch & Routing Module:** Executes geospatial indexing (PostGIS / H3 hexagons), ranks candidate vehicles, and manages dispatch acknowledgment timers.
* **Mission Lifecycle Module:** The central domain authority. Enforces the deterministic Mission State Machine from creation to completion.
* **Clinical & Patient Module:** Manages encrypted patient demographic records, time-series vital sign storage, and executes the NEWS2 clinical early warning rules engine.
* **Pre-Arrival Coordination Module:** Generates time-bound hospital radar views, dynamic ETA calculations, and incoming triage banners.
* **Notification & Alerting Module:** Delivers high-priority push notifications (FCM), WebSocket audio chimes, and SMS fallbacks.
* **IoT & Hardware Bridge Module:** Normalizes heterogeneous sensor payloads into standard clinical and telematic domain events.
* **Immutable Audit Journal Module:** Captures an append-only, tamper-evident log of all operational actions and state changes.

---

### 3.3 Infrastructure & Persistence
* **PostgreSQL with PostGIS:** Acts as the primary operational database. Handles relational transactions, spatial queries (ST_DWithin, ST_DistanceSphere), and multi-tenant security via Row-Level Security (RLS).
* **TimescaleDB Extension:** Leveraged within PostgreSQL for hypertable partitioning of high-frequency GPS breadcrumbs and vital telemetry, providing 10x compression and fast retention pruning.
* **Redis Cluster:** Serves three distinct roles:
  1. *Pub/Sub Backplane:* Bridges WebSocket nodes to broadcast events across distributed server instances.
  2. *Ephemeral State Cache:* Maintains hot vehicle locations and active dispatch countdown timers.
  3. *Rate Limiting & Ingestion Buffer:* Protects backend endpoints against rogue IoT device flood attacks.
* **Encrypted Object Storage (S3 / MinIO):** Stores non-relational clinical artifacts (12-lead ECG PDF exports, patient identification photos, signed handover receipts).

---

## 4. Architectural Boundaries & Data Flow Isolation

```
┌───────────────────────────┐         ┌───────────────────────────┐
│     TENANT A (HOSPITAL)   │         │  TENANT B (OPERATOR)      │
│  • Hospital ER Dashboard  │         │  • Fleet Dispatch Console │
│  • Patient Clinical Data  │         │  • Ambulance Maintenance  │
│  • Trauma Bay Allocation  │         │  • Driver Shift Rosters   │
└─────────────┬─────────────┘         └─────────────┬─────────────┘
              │                                     │
              │       ┌──────────────────────┐      │
              └──────>│ MISSION COORDINATION │<─────┘
                      │       ENVELOPE       │
                      │ (Transient, Scoped)  │
                      │ • Live Vehicle GPS   │
                      │ • Dynamic ETA        │
                      │ • Streaming Vitals   │
                      │ • Handover Protocol  │
                      └──────────────────────┘
```

* **Tenant Boundary Rule:** Tenant A can never query Tenant B's fleet records, drivers, or financial data.
* **Mission Envelope Exception:** When an ambulance from Tenant B is dispatched to transport a patient to Tenant A, a temporary, cryptographically signed **Mission Coordination Envelope** is created. This allows Tenant A to receive real-time GPS, ETA, and vitals strictly for the duration of that specific mission. Upon handover completion, the envelope is sealed and archived.
