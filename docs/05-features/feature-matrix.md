# Comprehensive Feature Matrix

**Status:** APPROVED FOR PHASE 0  
**Enforcement:** Strict release gating across MVP, Production, and Future milestones.

---

## 1. Feature Matrix Specification

| Feature Name | Target Customer | Target Persona | MVP | Production | Future | Priority | Technical Dependencies | Operational / Clinical Risk | Revenue Relevance |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- | :--- |
| **Emergency Mission Creation & Intake** | All Segments | Dispatcher, Hospital Admin | **YES** | **YES** | **YES** | P0 | Auth Module, PostGIS | Moderate: Address input errors | Core Platform Enabler |
| **Nearest Available Vehicle Recommendation** | Operators, Hospital Networks | Dispatcher | **YES** (Haversine) | **YES** (Road network) | **YES** (Traffic AI) | P0 | PostGIS Spatial Index | Moderate: Inaccurate travel estimates | High (Reduces SLA penalties) |
| **1-Tap Driver Dispatch Acceptance** | Operators, Independent Fleets | Driver | **YES** | **YES** | **YES** | P0 | FCM / WSS Alert | High: Driver distracted driving | Core Platform Enabler |
| **Background GPS Telematics Streaming** | All Segments | Driver, System | **YES** | **YES** | **YES** | P0 | Android Location Provider | High: Cellular dead-zones, battery drain | Core Platform Enabler |
| **Dynamic ETA Recalibration Engine** | Private Hospitals, Networks | Triage Nurse, Dispatcher | **YES** (Velocity) | **YES** (Routing API) | **YES** (Historical ML) | P0 | GPS Pipeline, Routing Service | High: Uncalibrated ED team assembly | High (Core Value Proposition) |
| **Live Inbound Hospital Pre-Arrival Radar** | Private Hospitals, Networks | Receiving Hospital User | **YES** | **YES** | **YES** | P0 | Realtime WebSocket Gateway | High: Screen ignored by triage nurses | Critical (Primary Hospital Payer Driver) |
| **Simulated Vitals Generator & Ingestion** | All (Testing / MVP) | System, Paramedic | **YES** | Replaced | Replaced | P0 | Ingestion REST Gateway | Low: Test artifact only | None (Internal R&D tool) |
| **Automated NEWS2 Clinical Early Warning Alert**| Private Hospitals, Networks | Receiving Hospital User | **YES** | **YES** | **YES** | P0 | Clinical Engine, Vitals Stream | Critical: False alarm fatigue or missed shock | Critical (Clinical Differentiation) |
| **Turn-by-Turn Navigation Intent** | All Segments | Driver | **YES** (Deep-link) | **YES** (Deep-link) | **YES** (Embedded SDK) | P0 | Google Maps / Waze Intent | Low: Reliance on third-party map app | Low (Convenience) |
| **Deterministic Milestone State Machine** | All Segments | Driver, Dispatcher | **YES** | **YES** | **YES** | P0 | Core Domain Engine | Moderate: Out-of-order state transitions | Core Platform Enabler |
| **Structured Digital Handover Protocol** | Private Hospitals, Operators | EMT, Receiving Nurse | **YES** (Basic) | **YES** (Dual Sign-off)| **YES** (Biometric/FHIR)| P0 | Mission Core Engine | High: Medicolegal dispute on transfer | High (Reduces ED Wall-Time) |
| **Offline Store-and-Forward Telemetry Cache** | All Segments | Driver, EMT | **YES** (Basic SQLite)| **YES** (Full Room Sync) | **YES** (Mesh sync) | P0 | Room DB, WorkManager | High: Data loss during deep dead-zones | Core Platform Enabler |
| **Physical IoT Medical Device Ingestion** | Private Hospitals, Networks | EMT, System | No | **YES** | **YES** | P1 | Serial/BLE Gateway, MQTT | High: Hardware monitor protocol changes | Critical (Hardware Add-on Surcharge) |
| **Dedicated Vehicular OBD-II CAN Bus Ingestion**| Commercial Operators | Fleet Manager | No | **YES** | **YES** | P1 | OBD-II Gateway, Teltonika parser| Moderate: Vehicle electrical noise | Medium (Fleet Management Tier) |
| **PostgreSQL Row-Level Security Multi-Tenancy** | Enterprise Networks, Operators | Super Admin, Org Admin | No (Logical IDs) | **YES** (Postgres RLS) | **YES** (Sharded) | P1 | Database Migration, Auth Middleware| Critical: Cross-tenant data leakage | Critical (Enterprise SaaS Prerequisite) |
| **Enterprise SSO & Directory Sync (SAML/OIDC)** | Hospital Networks | Organization Admin | No | **YES** | **YES** | P1 | OAuth2 / OIDC Provider | Moderate: Identity provider misconfigs | High (Enterprise Tier Gate) |
| **Tamper-Evident Medicolegal Audit Vault** | Hospital Networks, Operators | Compliance Officer | No (Standard log) | **YES** (WORM / Hash chain)| **YES** (Blockchain anchor) | P1 | Cryptographic Service | High: Malpractice discovery liability | High (Enterprise Governance Gate) |
| **Hospital Diversion & Capacity Broadcast** | Hospital Networks, Gov EMS | Hospital Admin, Dispatcher | No | **YES** | **YES** | P1 | Hospital Facility Module | High: Improper ambulance diversion | High (Regional Coordination Tier) |
| **Jurisdiction-Wide Fleet Heatmap & CAD Bridge** | Government / EMS Authorities | Public Safety Monitor | No | **YES** | **YES** | P1 | CAD API, Spatial Aggregator | High: Municipal procurement delays | Critical (B2G Government Tier) |
| **Automated SaaS Subscription & Metering Engine**| Commercial Operators, Hospitals| Finance Lead | No | **YES** | **YES** | P1 | Stripe / Razorpay Webhooks | Low: Billing reconciliation errors | High (Commercial Monetization) |
| **Continuous Waveform Streaming (12-Lead ECG)** | Hospital Networks, Super-Specialty | Cardiologist, ER Attending | No | No | **YES** | P2 | High-throughput streaming, Canvas | High: High cellular bandwidth costs | High (Specialty Add-on) |
| **Bidirectional En-Route Video Consultation** | Private Hospitals | ER Attending, EMT | No | No | **YES** | P2 | WebRTC SFU Media Server | High: Video dropouts in moving ambulance | High (Premium Clinical Add-on) |
| **AI Demand Forecasting & Dynamic Positioning** | Government EMS, Large Operators | Fleet Operations Lead | No | No | **YES** | P2 | Machine Learning Pipeline | Moderate: Inaccurate predictive shifts | Medium (Fleet Optimization) |
| **Mass Casualty Incident (MCI) Auto-Triage** | Government / EMS Authorities | Disaster Commander | No | No | **YES** | P2 | MCI Triage Module (START/SALT) | Critical: Severe disaster chaos | High (Public Safety Defense) |
