# System Architecture Overview

**Status:** SUPERSEDED & ELABORATED BY PHASE 0 ARCHITECTURE  
**Canonical Specifications:**
- [System Architecture Document](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/02-architecture/system-architecture.md)
- [Domain Model Specification](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/02-architecture/domain-model.md)
- [Architecture Diagrams (10 Mermaid Diagrams)](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/02-architecture/architecture-diagrams.md)
- [ADR-001: Modular Monolith vs. Microservices](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-001-modular-monolith-vs-microservices.md)
- [ADR-002: Multi-Tenant Architecture & Data Partitioning](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/06-adrs/ADR-002-multi-tenant-architecture.md)

---

## 1. Architecture Topology
The platform implements an **Event-Driven Modular Monolith** designed for high transactional consistency, sub-second realtime latency, and minimal operational overhead during MVP and initial enterprise scaling:
* **Edge Clients:** Android Native (Kotlin + Room SQLite) for drivers/EMTs; React/Vite SPAs for Dispatch, Hospital ED Radar, and Administrative Consoles; Edge IoT gateways (ESP32/STM32) for physical hardware telematics.
* **API Gateway & Ingestion Tier:** Reverse proxy terminating TLS 1.3, rate-limiting incoming telemetry bursts via token buckets, and validating tenant headers.
* **Core Application Core:** Decoupled bounded modules (`auth`, `organization`, `fleet`, `dispatch`, `mission`, `clinical`, `realtime`, `audit`) communicating via typed interfaces and an in-process asynchronous domain event bus.
* **Realtime Backplane:** Redis Cluster managing WebSocket connections and pub/sub message dissemination across web dashboards.
* **Data Storage Tier:** PostgreSQL 16+ with PostGIS for spatial operations and Row-Level Security (RLS); TimescaleDB extension for high-frequency telematics hypertables; Encrypted S3/MinIO for non-relational clinical artifacts.

---

## 2. Key Architecture Diagrams
1. **[System Context (C4)](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/02-architecture/architecture-diagrams.md#1-system-context-diagram-c4-context):** High-level actor interactions with external map services, push notifications, and IoT sensors.
2. **[High-Level Container Architecture](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/02-architecture/architecture-diagrams.md#2-high-level-container-architecture-c4-container):** Decoupled internal modules, database hypertables, and Redis backplane.
3. **[Mission Lifecycle State Diagram](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/02-architecture/architecture-diagrams.md#4-mission-lifecycle-state-diagram):** Deterministic 13-state FSM from `REQUESTED` to `COMPLETED`.
4. **[Multi-Tenant Data Boundary](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/02-architecture/architecture-diagrams.md#9-multi-tenant-data-boundary--cross-tenant-coordination):** PostgreSQL RLS isolation and transient Mission Coordination Envelopes.

---

## 3. Technology Stack Selection Rationale
* **Modular Monolith vs. Microservices (ADR-001):** Selected to guarantee atomic transactions during emergency dispatch without distributed saga complexity.
* **PostgreSQL Row-Level Security (ADR-002):** Selected to enforce tenant privacy at the database engine level across commercial competitors.
* **WebSockets with Redis Pub/Sub (ADR-005):** Selected for sub-500ms broadcast of location and critical NEWS2 vitals alerts.
* **Offline-First Store-and-Forward (ADR-007):** Selected to prevent data loss during cellular network dropouts in moving ambulances.
