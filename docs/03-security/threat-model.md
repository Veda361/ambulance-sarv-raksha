# Threat Model: Ambulance Coordination Platform

**Status:** APPROVED FOR PHASE 0  
**Methodology:** STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) + Threat Vector Analysis.

---

## 1. System Threat Landscape & Attack Surface

The platform exposes multiple attack vectors due to its distributed edge footprint (mobile phones, IoT microcontrollers, public cellular networks) and sensitive clinical data processing:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ATTACK SURFACE ENVELOPE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Edge Devices: Android Driver App & In-Vehicle IoT Gateway (mTLS, GPS)   │
│ 2. Network Transit: Cellular Ingestion over Public Internet (WSS, HTTPS)   │
│ 3. API & Web Gateway: Dispatch, Hospital, and Admin Dashboards              │
│ 4. Multi-Tenant Core: Database, Redis Pub/Sub, State Machine Engine         │
│ 5. Third-Party Integrations: Maps API, Push Gateways (FCM), SMS Relays      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. STRIDE Threat Analysis Matrix

| STRIDE Category | Threat Vector Description | Impacted Asset | Severity | Mitigation Strategy & Architectural Defense |
| :--- | :--- | :--- | :--- | :--- |
| **Spoofing** | Attacker impersonates an active ambulance or driver, injecting false GPS tracks or acknowledging dispatches. | Driver Identity / Fleet Ingestion | HIGH | Device binding via cryptographic hardware fingerprints; mutual TLS (mTLS) for IoT gateways; signed short-lived JWT tokens tied to verified session states. |
| **Tampering** | In-transit tampering of telemetry packets (e.g., modifying vital signs to conceal clinical neglect). | Vitals Stream / State Machine | CRITICAL | Strict TLS 1.3 encryption on all connections; message sequence numbers and HMAC integrity checks on edge packets; immutable append-only audit journals. |
| **Repudiation** | Paramedic or Hospital Nurse denies receiving or handing over a patient during medicolegal malpractice litigation. | Clinical Handover Protocol | HIGH | Dual-party cryptographic sign-off; capture of nurse user ID, timestamp, client IP, and cryptographic hash of final handover summary into append-only WORM storage. |
| **Information Disclosure** | Competitor ambulance operator or malicious actor intercepts private patient health information or hospital diversion status. | PHI / Tenant Privacy | CRITICAL | Multi-tenant Row-Level Security (RLS) in PostgreSQL; field-level AES-256-GCM encryption of sensitive demographic fields; strict role-based data projection. |
| **Denial of Service** | Malicious script floods the telematics ingestion endpoint with bogus GPS data, overwhelming backend Redis and database nodes. | System Availability | HIGH | Edge rate-limiting (Token Bucket) per vehicle token at API Gateway; connection throttling; Redis buffering with automatic drop of malformed payloads. |
| **Elevation of Privilege** | Driver user modifies JWT claims or API parameter `tenant_id` to execute administrative mission overrides across hospitals. | Core RBAC Engine | CRITICAL | Server-side validation of JWT claims; `tenant_id` extracted exclusively from cryptographically signed server tokens, never accepted as trusted client input; PostgreSQL RLS enforcement. |

---

## 3. Deep-Dive Analysis of Specific Critical Failure Scenarios

### Scenario 1: Compromised or Stolen Android Driver Device
* **Threat:** A physical ambulance tablet is stolen from the vehicle cabin by an unauthorized party.
* **Risk:** Attacker views active emergency call details, falsifies driver state, or accesses caller contact information.
* **Mitigation:**
  1. *Immediate Remote Session Invalidation:* Fleet Admin or Dispatcher can click "Revoke Device Session" from the Organization Console, instantly blacklisting the device token in Redis.
  2. *Ephemeral Local Storage:* Android Room database is encrypted with SQLCipher; keys are maintained in Android Keystore with biometric/passcode gating.
  3. *Auto-Timeout:* App enters locked state after 15 minutes of device inactivity.

### Scenario 2: Replayed or Duplicated IoT Telematics Packets
* **Threat:** An attacker captures cellular telemetry packets and replays them, or an edge device on an erratic cellular link retransmits identical GPS breadcrumbs multiple times.
* **Risk:** Erroneous vehicle positioning, incorrect dynamic ETA calculations, or backend database bloat.
* **Mitigation:**
  1. *Monotonic Sequence Tracking:* Every packet carries a tuple `(device_id, sequence_number, timestamp)`.
  2. *Idempotent Deduplication:* The ingestion engine caches the highest acknowledged `sequence_number` in Redis for each device. Packets with sequence numbers $\le$ last acknowledged are immediately dropped without triggering downstream database writes.

### Scenario 3: Malicious Organization User (Internal Insider Threat)
* **Threat:** A rogue dispatcher or admin within Hospital A attempts to scrape incoming patient statistics or dispatch history from rival Hospital B on the same multi-tenant platform.
* **Risk:** Commercial espionage, patient privacy breach.
* **Mitigation:**
  1. *Row-Level Security Hardening:* Database queries execute within a PostgreSQL session setting `app.current_tenant_id = 'Hospital_A'`. Any attempt to craft raw SQL or API queries referencing Hospital B yields zero rows.
  2. *Immutable Audit Logging:* All query access to clinical handover logs is recorded in the platform audit journal, creating an unerasable forensic trail.

### Scenario 4: Unauthorized Access to Patient Vitals En Route
* **Threat:** An unauthenticated observer on a public Wi-Fi network attempts to eavesdrop on live vital signs streamed from the ambulance to the hospital.
* **Risk:** Severe patient privacy violation (HIPAA / DPDP breach).
* **Mitigation:**
  1. *HSTS & TLS 1.3:* Plaintext communication is rejected.
  2. *Scoped WebSocket Topic Authorization:* The WebSocket server authenticates clients on connection and validates topic subscription tokens. A client can only subscribe to `topic:mission:{mission_id}:vitals` if their JWT explicitly contains an active clinical assignment claim for that mission.
