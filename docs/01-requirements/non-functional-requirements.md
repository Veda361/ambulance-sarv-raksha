# Non-Functional Requirements Document (NFRD)

**Status:** APPROVED FOR PHASE 0  
**Enforcement Level:** Architecture Verification Gate (All architectural designs must satisfy these criteria).

---

## 1. Performance & Latency Requirements

### NFR-001: Sub-Second Realtime Distribution Latency
* **Requirement:** Telemetry events (GPS updates, state changes, vital signs) received by the backend ingestion gateway must be processed, evaluated for alerts, and pushed to active subscribed WebSocket clients in under **500 milliseconds (P95)** and under **1,000 milliseconds (P99)** under normal operating load.
* **Category:** Performance
* **Target:** P95 < 500ms, P99 < 1,000ms.
* **Verification Method:** Synthetic load testing with distributed WebSocket subscriber benchmarks.

### NFR-002: Core API Response Time
* **Requirement:** All standard synchronous transactional REST API endpoints (e.g., mission creation, driver status update, vehicle list) must respond with an HTTP status within **200 milliseconds (P95)** and **500 milliseconds (P99)**, excluding network transit time.
* **Category:** Performance
* **Target:** P95 < 200ms.
* **Verification Method:** Automated API benchmark tests under 100 concurrent requests.

---

## 2. Availability & Reliability Requirements

### NFR-003: System High Availability (SLA)
* **Requirement:** The production platform core services (API, Database, WebSocket cluster) must achieve an annual availability of **99.95%** (excluding scheduled, announced maintenance windows of <= 2 hours/month).
* **Category:** Availability
* **Target:** 99.95% uptime (< 4.38 hours unplanned downtime per year).
* **Verification Method:** Multi-region or multi-availability-zone deployment with synthetic external health check monitors.

### NFR-004: Fault Recovery Time (RTO) & Recovery Point (RPO)
* **Requirement:** The system must guarantee a Recovery Point Objective (RPO) of **<= 1 minute** for mission transactions and an automated Recovery Time Objective (RTO) of **<= 15 minutes** in the event of an infrastructure host failure.
* **Category:** Reliability / Disaster Recovery
* **Target:** RPO <= 1m, RTO <= 15m.
* **Verification Method:** Disaster simulation drills (killing primary database node and verifying automated replica promotion).

---

## 3. Scalability & Capacity Requirements

### NFR-005: Horizontal Telematics Ingestion Scalability
* **Requirement:** The ingestion architecture must scale horizontally to handle up to **10,000 simultaneously active ambulances** streaming telemetry every 3 seconds (equivalent to ~3,333 ingest requests/sec) without degradation of database responsiveness or queue backpressure.
* **Category:** Scalability
* **Target:** Sustained 5,000 events/sec ingestion throughput.
* **Verification Method:** Distributed load generation simulating 10,000 virtual vehicles using MQTT/WebSocket load tools.

---

## 4. Security & Privacy Requirements

### NFR-006: Encryption Standards (In-Transit & At-Rest)
* **Requirement:** All external network communications must strictly require **TLS 1.3** (with TLS 1.2 as minimum allowable cipher fallback). All database tables, file storage volumes, and persistent message queues must be encrypted at rest using **AES-256**.
* **Category:** Security
* **Target:** 100% encrypted network surface; zero unencrypted plaintext sockets.
* **Verification Method:** Automated TLS cipher suite scanner (Qualys SSL Labs A+ rating) and storage encryption auditing.

### NFR-007: Zero-Trust Tenant Isolation
* **Requirement:** The system must enforce tenant boundaries at both the API routing layer and the database layer (via PostgreSQL Row-Level Security). No API endpoint shall allow querying cross-tenant resources without cryptographically signed, time-bound mission delegation tokens.
* **Category:** Security
* **Target:** Zero cross-tenant data leaks.
* **Verification Method:** Automated multi-tenant penetration test suite asserting 403/404 on cross-tenant ID substitution.

### NFR-008: Privacy by Design & PHI Protection
* **Requirement:** Protected Health Information (patient identity, medical history, clinical vitals) must be logically separated from operational vehicle telemetry. System application logs and monitoring telemetry must automatically redact/scrub all PHI fields before log ingestion.
* **Category:** Privacy
* **Target:** Zero PHI leakage into application logs, APM traces, or unencrypted metrics.
* **Verification Method:** Automated log regex scanning for patient names, phone numbers, and diagnostic keywords in staging.

---

## 5. Auditability & Data Integrity

### NFR-009: Immutable, Tamper-Evident Audit Logging
* **Requirement:** All critical domain events (mission state transitions, clinical alerts, dispatch overrides, and user authentications) must be written to an append-only audit journal. Modifying or deleting audit entries through application APIs must be architecturally blocked.
* **Category:** Auditability
* **Target:** 100% audit coverage for state-modifying actions.
* **Verification Method:** Attempting direct SQL UPDATE/DELETE on audit tables blocked via database permissions and triggers.

### NFR-010: Idempotent Event Processing & Deduplication
* **Requirement:** The ingestion pipeline must guarantee idempotency. If duplicate telemetry packets or delayed sensor updates arrive due to cellular network retries, the backend must discard duplicate sequence numbers and maintain chronological integrity.
* **Category:** Data Integrity
* **Target:** 100% deduplication of retransmitted packets based on `(device_id, sequence_id, timestamp)`.
* **Verification Method:** Replay attack tests feeding identical packets twice to the ingestion endpoint.

---

## 6. Offline Resilience & Network Fault Tolerance

### NFR-011: Store-and-Forward Client Resilience
* **Requirement:** The mobile application must operate deterministically during cellular disconnections lasting up to **120 minutes**. The mobile client must cache all GPS breadcrumbs, driver state changes, and clinical inputs locally in an encrypted database and seamlessly drain the queue upon network restoration without data loss.
* **Category:** Offline Resilience
* **Target:** Zero data points dropped after 120-minute cellular blackout.
* **Verification Method:** Airplane mode field test: initiate mission, record 10 minutes of driving and milestones while offline, reconnect, and verify full synchronization on server.

---

## 7. Observability & Operational Readiness

### NFR-012: Comprehensive Telemetry & Distributed Tracing
* **Requirement:** 100% of HTTP API requests, background job executions, and WebSocket broadcasts must emit structured JSON logs and propagate OpenTelemetry trace contexts. Metrics for error rates, database connection pools, and memory utilization must be exported to Prometheus.
* **Category:** Observability
* **Target:** End-to-end trace correlation from mobile HTTP request to database query.
* **Verification Method:** Validating trace propagation in Jaeger/Grafana Tempo.

---

## 8. Usability, Ergonomics & Accessibility

### NFR-013: High-Stress Mobile Ergonomics
* **Requirement:** The driver mobile application must feature a high-contrast UI with touch targets of at least **64x64 dp** for primary milestone controls, readable in direct bright sunlight and operable with gloved hands.
* **Category:** Usability / Ergonomics
* **Target:** All primary driving workflow actions achievable within a single tap.
* **Verification Method:** Ergonomic testing in daylight vehicle cabin conditions.
