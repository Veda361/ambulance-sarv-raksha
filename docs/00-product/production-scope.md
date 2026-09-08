# Production Scope: Ambulance Coordination Platform

**Status:** APPROVED FOR PHASE 0  
**Compliance Standard:** All regulatory references are labeled `[REQUIRES LEGAL/COMPLIANCE REVIEW]`. No compliance claims are made without certified third-party audits.

---

## 1. Evolution from MVP to Production
The transition from MVP to a commercial, production-grade emergency response platform requires establishing enterprise-grade availability, security, observability, data governance, and operational resilience.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PRODUCTION PLATFORM TOPOLOGY                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  EDGE / FIELD TIER                                                          │
│  • Android Native Driver/EMT App (Offline SQLite store & forward)           │
│  • IoT Telematics Gateway (OBD-II, MQTT over mTLS, hardware watchdog)       │
│  • Medical Monitor Bridges (Mindray, Philips serial/BLE protocol parsers)   │
├─────────────────────────────────────────────────────────────────────────────┤
│  INGESTION & REALTIME TIER                                                  │
│  • Distributed WebSocket / SSE Gateway with Redis Pub/Sub cluster           │
│  • Ingestion Rate-Limiter & Deduplication Buffer                            │
│  • Kafka / NATS Event Streaming Backbone for high-throughput telematics     │
├─────────────────────────────────────────────────────────────────────────────┤
│  CORE DOMAIN PLATFORM (MODULAR MONOLITH)                                    │
│  • Tenant Isolation Middleware & Row-Level Security (RLS)                   │
│  • Mission Lifecycle & State Machine Engine                                 │
│  • Clinical Alerting & NEWS2 Calculator Service                             │
│  • Granular Role-Based Access Control (RBAC) & OAuth2/OIDC Engine           │
├─────────────────────────────────────────────────────────────────────────────┤
│  PERSISTENCE, AUDIT & ANALYTICS                                             │
│  • Primary Relational DB (PostgreSQL HA with read replicas & TimescaleDB)   │
│  • Immutable Append-Only Audit Store (WORM / cryptographic hash chains)     │
│  • Encrypted Object Storage (S3 / MinIO for ECG traces & PDFs)              │
├─────────────────────────────────────────────────────────────────────────────┤
│  OBSERVABILITY, SECRETS & GOVERNANCE                                        │
│  • OpenTelemetry Tracing + Prometheus Metrics + Grafana Dashboards          │
│  • Centralized Structured Logging (Loki / ELK) with PHI redaction           │
│  • HashiCorp Vault / Cloud KMS for automated secret & key rotation          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Comprehensive Production Requirements

### 2.1 Identity, Authentication & Authorization
* **OAuth 2.0 & OpenID Connect (OIDC):** Standards-based authentication supporting enterprise Single Sign-On (SAML 2.0 / Azure AD / Okta) for hospital network users. `[CONFIRMED]`
* **Multi-Factor Authentication (MFA):** Mandatory TOTP/WebAuthn MFA for all administrative and dispatch roles. `[CONFIRMED]`
* **Granular Role-Based Access Control (RBAC):** Resource-level permission evaluations enforcing organizational context (`tenant_id`, `hospital_id`, `ambulance_id`). `[CONFIRMED]`
* **Device Authentication:** Hardware gateways and Android tablets authenticated via client certificates (mTLS) or cryptographically signed device tokens with automated revocation. `[CONFIRMED]`

### 2.2 Strict Multi-Tenancy & Data Isolation
* **Row-Level Security (RLS) & Tenant Middleware:** Strict PostgreSQL RLS policies guaranteeing no cross-tenant query execution. Every database query automatically scoped by `tenant_id`. `[CONFIRMED]`
* **Cross-Tenant Safe Data Sharing:** Encrypted, time-bound mission view tokens allowing receiving hospitals to view incoming patient telemetry without gaining access to the ambulance operator’s internal tenant records. `[CONFIRMED]`

### 2.3 Immutable Audit Logging & Medicolegal Retention
* **Append-Only Audit Journal:** Every mission state transition, clinical note edit, dispatch override, and user login recorded in a write-once, append-only audit table. `[CONFIRMED]`
* **Cryptographic Hash Chaining:** Audit log entries cryptographically chained (Merkle tree / SHA-256 hash chains) to prove records were not altered post-incident during medicolegal discovery. `[PROPOSED]`
* **Data Retention Policies:** Operational telemetry retained for 90 days; clinical ePCR and handover records retained for 7 years (configurable per regional statutory requirement). `[REQUIRES LEGAL/COMPLIANCE REVIEW]`

### 2.4 High-Availability & Disaster Recovery (HA/DR)
* **High Availability Target:** 99.95% API and realtime gateway uptime (excluding scheduled maintenance). `[CONFIRMED]`
* **Recovery Point Objective (RPO):** RPO <= 1 minute for transactional mission data; zero loss of completed handovers. `[CONFIRMED]`
* **Recovery Time Objective (RTO):** RTO <= 15 minutes for complete platform recovery via automated database failover and multi-zone orchestration. `[CONFIRMED]`
* **Automated Backups:** Continuous Write-Ahead Log (WAL) archiving to geographically separated object storage with automated daily restoration testing. `[CONFIRMED]`

### 2.5 Offline Resilience & Edge Telemetry Queueing
* **Store-and-Forward Engine:** Android client utilizes an encrypted local SQLite (Room) database to queue location breadcrumbs, clinical interventions, and state transitions during cellular blackouts. `[CONFIRMED]`
* **Conflict-Free Synchronization:** Telemetry points timestamped at generation with monotonic edge clocks; backend performs idempotent deduplication and chronological re-ordering on reconnection. `[CONFIRMED]`
* **Cellular Fallback:** In deep dead zones, critical mission events (e.g., driver acceptance, arrival) can trigger automated SMS fallback transmissions to the backend gateway. `[PROPOSED]`

### 2.6 Realtime & Notification Infrastructure
* **Horizontally Scalable WebSockets:** WebSocket cluster managed via Redis Pub/Sub backplane, enabling state broadcast across thousands of concurrent hospital screens. `[CONFIRMED]`
* **Push Notification Fallback:** High-priority Android notifications delivered via Firebase Cloud Messaging (FCM) / Google Play Services with priority "high" (waking device from Doze mode). `[CONFIRMED]`
* **Audible Dispatch & Triage Chimes:** Web and mobile dashboards incorporate distinctive audio alarms for high-acuity dispatch and critical pre-arrival alerts. `[CONFIRMED]`

### 2.7 Observability, Telemetry & SRE Tooling
* **OpenTelemetry Instrumentation:** Full distributed tracing across HTTP requests, WebSocket messages, database queries, and external API calls. `[CONFIRMED]`
* **Prometheus Metrics & Grafana:** Real-time dashboards monitoring API P95/P99 latency, WebSocket active connection counts, ingestion error rates, and GPS drift anomalies. `[CONFIRMED]`
* **Centralized Structured Logging:** JSON-formatted logs with automatic scrubbing/redaction of Patient Health Information (PHI) before ingestion into Elasticsearch/Loki. `[CONFIRMED]`
* **Error Tracking:** Integration with Sentry for real-time exception tracking and crash diagnostics across backend and Android clients. `[CONFIRMED]`

### 2.8 Security Controls & Encryption
* **Encryption in Transit:** Mandatory TLS 1.3 for all HTTP/WebSocket endpoints; mTLS for IoT hardware gateways. `[CONFIRMED]`
* **Encryption at Rest:** AES-256 encryption across all databases, persistent volumes, and object storage buckets. `[CONFIRMED]`
* **Field-Level Encryption:** Sensitive patient identifiers (Name, Government ID, Contact Info) encrypted at the database field level using tenant-specific KMS keys. `[PROPOSED]`
* **Secrets Governance:** Zero plaintext secrets in code or environment variables; dynamic secrets managed via HashiCorp Vault or AWS Secrets Manager. `[CONFIRMED]`

### 2.9 CI/CD, Testing & Release Engineering
* **Automated Pipeline:** GitHub Actions CI/CD enforcing linting, static code analysis (SonarQube), security vulnerability scanning (Trivy/Snyk), unit tests, and integration tests on every pull request. `[CONFIRMED]`
* **Strict Quality Gates:** 85%+ unit test coverage on core domain logic; zero high/critical CVEs permitted in container builds. `[CONFIRMED]`
* **Zero-Downtime Deployments:** Blue/Green or rolling Kubernetes deployments with automated health checks and canary verification. `[CONFIRMED]`

### 2.10 Regulatory & Compliance Posture
* `[REQUIRES LEGAL/COMPLIANCE REVIEW]` **Data Privacy & Healthcare Mandates:** The system must be structured to adhere to regional data privacy laws (e.g., India DPDP Act 2023, ABDM M1/M2/M3 standards, HIPAA Security Rule, and EU GDPR).
* `[REQUIRES LEGAL/COMPLIANCE REVIEW]` **Medical Device Disclaimer:** The platform acts as an emergency communication and pre-hospital data relay system, NOT a SaMD (Software as a Medical Device) autonomous diagnostic system. Formal classification under FDA/CDSCO guidelines must be confirmed.
