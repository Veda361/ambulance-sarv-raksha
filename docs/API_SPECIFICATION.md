# API & Real-time Specification Overview

**Status:** SUPERSEDED & ELABORATED BY PHASE 0 ARCHITECTURE  
**Canonical Specifications:**
- [System Architecture Specification](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/02-architecture/system-architecture.md)
- [ADR-005: Realtime Transport Architecture](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-005-realtime-architecture.md)
- [ADR-006: Hardware Abstraction & IoT Ingestion](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-006-iot-ingestion-architecture.md)
- [Security Baseline: Authentication & Token Specifications](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/03-security/security-baseline.md)

---

## 1. Protocols & Standards
* **REST API:** HTTPS / TLS 1.3 for synchronous transactional operations (CRUD for organizations, users, vehicles, and missions).
* **Real-time Streaming:** WebSockets (WSS) over Redis Pub/Sub cluster for sub-second location and vital signs broadcast (< 500ms P95). Automatic fallback to Server-Sent Events (SSE) for firewalled hospital environments.
* **IoT Hardware Ingestion:** MQTT over TLS (mTLS with X.509 client certificates) or HTTPS REST for vehicle telematics gateways and patient monitor serial bridges.
* **Authentication Scheme:** OAuth 2.0 with asymmetric JWTs (RS256/Ed25519); mandatory MFA for dispatch and admin roles; device binding for mobile clients.

---

## 2. Core API Endpoint Groups
1. **Authentication & Identity (`/api/v1/auth`):**
   - `POST /login`, `POST /refresh`, `POST /logout`, `POST /mfa/verify`.
2. **Organization & Multi-Tenancy (`/api/v1/organizations`):**
   - Scoped by `tenant_id` via PostgreSQL Row-Level Security (RLS).
3. **Fleet & Telematics (`/api/v1/fleet`):**
   - `GET /ambulances` (Filter by availability, capability BLS/ALS).
   - `POST /telemetry/location` (Ingests Lat, Lon, Bearing, Speed, SequenceNo).
4. **Mission Lifecycle & Dispatch (`/api/v1/missions`):**
   - `POST /missions` (Create emergency request).
   - `POST /missions/{id}/assign` (Allocate ambulance & crew).
   - `POST /missions/{id}/accept` (Driver 1-tap accept).
   - `POST /missions/{id}/status` (Progress milestones: `EN_ROUTE`, `ARRIVED`, `ONBOARD`, etc.).
5. **Clinical & Vitals (`/api/v1/clinical`):**
   - `POST /telemetry/vitals` (Ingest HR, SpO2, NIBP, RR).
   - `POST /missions/{id}/handover` (Dual digital sign-off and medicolegal seal).

---

## 3. Real-Time WebSocket Topics
* `tenant:{id}:fleet` — Fleet availability status changes and global map breadcrumbs.
* `hospital:{id}:radar` — Inbound ambulances, live dynamic ETA countdowns, and NEWS2 early warning alerts.
* `mission:{id}:telemetry` — Scoped, transient clinical vitals and location stream for active mission participants.
