# Product Scope: Ambulance Coordination Platform

**Status:** APPROVED FOR PHASE 0  
**Enforcement Rule:** Scope creep is strictly prohibited. Any capability not explicitly categorized below as `MVP` or `PRODUCTION` must not be scheduled for Phase 1 or Phase 2 engineering sprints without an updated Architecture Decision Record (ADR) and formal scope review.

---

## 1. Scope Categorization Framework
The platform’s capabilities are categorized across six distinct lifecycle boundaries:
1. **IN SCOPE:** The overarching thematic envelope of the platform.
2. **MVP (Phase 1):** The absolute minimum end-to-end slice to validate operational feasibility and hospital coordination.
3. **POST-MVP (Phase 1.5):** Immediate hardening, operational feedback integration, and initial field deployment.
4. **PRODUCTION (Phase 2):** Fully resilient, high-availability, audited, multi-tenant enterprise system ready for commercial contracting.
5. **FUTURE (Phase 3+):** Forward-looking enhancements, AI optimization, and national-scale integrations.
6. **OUT OF SCOPE:** Explicitly rejected capabilities to prevent architecture bloat and clinical liability.

---

## 2. Scope Matrix by Capability Domain

| Capability Domain | MVP Scope (Phase 1) | Post-MVP Scope (Phase 1.5) | Production Scope (Phase 2) | Future Scope (Phase 3+) | Out of Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Fleet & Vehicle Tracking** | GPS breadcrumb streaming (Android device GPS); basic vehicle profile (ALS/BLS); current location view on web map. | Geofence detection (arrived scene/hospital); speed & bearing telemetry; basic telemetry health check. | Dedicated IoT OBD-II / telematics unit support; hardware GPS failover; fleet maintenance logs; fuel tracking. | Computer vision dashcam stream; EV battery state-of-charge routing; automated pre-positioning algorithms. | Physical vehicle engine control; remote speed throttling; autonomous driving integration. |
| **Mission & Dispatch Management** | Manual mission creation by Hospital Admin/Dispatcher; single vehicle assignment; driver accept/reject; basic state transitions. | Multi-vehicle queue; priority-based dispatch; driver re-assignment; automated timeout on unacknowledged dispatch. | Algorithmic vehicle recommendation (proximity + capabilities); multi-agency mutual aid dispatch; scheduled non-emergency transport. | AI-driven dynamic demand forecasting; multi-casualty incident (MCI) auto-triage dispatch. | Fully automated dispatch with zero human-in-the-loop oversight for high-acuity calls. |
| **Mobile & Crew Workflows** | Single Android app for driver; one-tap state updates; pickup/dropoff address display; background location beacon. | Turn-by-turn navigation deep-linking (Google Maps/OSM); audio chimes for new dispatches. | Dedicated dual-role app or paired EMT/Driver views; digital clinical handover sign-off; offline incident cache with sync. | Wearable haptic alerts for crew; hands-free voice command interface for drivers. | Custom proprietary in-vehicle hardware tablets required for operation. |
| **Patient & Clinical Monitoring** | Basic patient profile (Name, Age, Gender, Chief Complaint); simulated vitals generation (HR, SpO2, BP) pushed to cloud. | Manual EMT vital entry on mobile; basic vital trend display on hospital screen; critical threshold flags. | Physical IoT patient monitor ingestion (MQTT/Bluetooth bridge); NEWS2 / MEWS automated score calculation; 12-lead ECG PDF upload. | Continuous waveform streaming (raw Pleth, ECG vector); AI automated arrhythmia detection assistance. | Autonomous diagnostic recommendations; automated drug dosage calculation without clinician oversight. |
| **Hospital Pre-Arrival Coordination** | Single-hospital live dashboard; active incoming ambulance list; dynamic ETA; display of incoming vitals & alerts. | Multi-department view (Triage, Trauma, Cath Lab); audio-visual chime on ambulance within 5-minute geofence. | Full hospital network dashboard; bed reservation requests; direct two-way secure text broadcast; diversion status toggle. | Direct bidirectional video consultation en-route between emergency physician and paramedic. | Full Hospital Information System (HIS); patient billing ledger; inpatient bed management. |
| **Multi-Tenancy & Governance** | Hardcoded or single-tenant database with logical organization tag; basic role differentiation. | Standard multi-tenant schema; organization admin console; hospital-level isolation. | Full multi-tenant isolation with Row-Level Security (RLS); custom organizational hierarchies; role-based granular permissions. | Federation across cross-regional health authorities; sovereign data residency per tenant. | Multi-cloud distributed database sharding across unrelated geographic jurisdictions. |
| **Security, Audit & Compliance** | HTTPS/WSS encryption; JWT-based user authentication; basic API access control. | Role-based authorization middleware; basic event logging for state changes. | Tamper-evident immutable audit logs; encrypted at-rest PHI (AES-256); secret management via Vault/KMS; rate-limiting & WAF. | Cryptographic blockchain verification of medicolegal handovers; zero-trust mesh. | Defense-grade air-gapped military deployments. |
| **Offline Resilience** | Basic reconnection logic; temporary local location caching on Android during network drops. | Local SQLite queue for location points; retry backoff strategy for network recovery. | Full store-and-forward architecture for all telemetry and events; idempotent server processing; duplicate deduplication. | Mesh radio ad-hoc networking (LoRa/satellite failover) for extreme disaster zones. | Analog radio packet integration (e.g., APRS/AX.25). |

---

## 3. Clear Boundaries: MVP vs. Production Scope

### 3.1 What is explicitly IN the MVP:
1. **Complete Closed-Loop Lifecycle:** A mission can be initiated, dispatched, accepted, tracked via live GPS, enriched with simulated vitals, alerted upon vital degradation, notified to the receiving hospital, and marked as completed.
2. **Deterministic State Progression:** Mission state machine validated across 10 distinct states (`REQUESTED` to `COMPLETED`).
3. **Real-Time Map Synchronization:** Hospital and Dispatcher dashboards reflect live ambulance position at minimum 5-second intervals.
4. **Simulated Telemetry Pipeline:** Reliable software-driven telemetry generator validating the end-to-end ingestion and alert pipeline before physical medical monitor testing.

### 3.2 What is explicitly POSTPONED to Production:
1. **Physical Hardware Certification:** Integrating real medical monitors via BLE/serial gateways.
2. **Complex Organizational Hierarchies:** Multi-tiered hospital networks with sub-departments and parent holding companies.
3. **Commercial Subscription & Billing:** Stripe/Razorpay automated SaaS billing, usage metering, and invoice generation.
4. **Disaster Command Center:** Multi-agency incident command dashboards for municipal disaster authorities.
5. **Rigorous Compliance Verification:** Full external audits for HIPAA, SOC 2, and local data protection regulations.

---

## 4. Non-Negotiable Out of Scope Items (Permanent Guardrails)
The following capabilities are **permanently out of scope** for this platform architecture:
* `[OUT OF SCOPE]` **Autonomous Clinical Diagnosis:** The platform will never diagnose conditions or prescribe medications independently.
* `[OUT OF SCOPE]` **Replacing Human Dispatchers / Clinicians:** The platform coordinates and assists; human operators retain final authorization on dispatch and medical care.
* `[OUT OF SCOPE]` **Complete Hospital Information System (HIS/EHR):** The platform is not an electronic health record replacement; its clinical scope terminates at the emergency department handover.
* `[OUT OF SCOPE]` **Vehicle Fleet Telematics Hardware Manufacturing:** The platform develops software and reference IoT firmware; it will not manufacture physical vehicular telematics hardware.
