# Business & Subscription Model: Ambulance Coordination Platform

**Status:** APPROVED FOR PHASE 0  
**Financial Classification:** Pricing structures and tier packaging outlined below are `[PROPOSED]` business models. No binding price figures are finalized. Operational and architectural entitlement boundaries are `[CONFIRMED]`.

---

## 1. Monetization Philosophy & Architecture
The platform operates as a multi-tenant B2B / B2G Software-as-a-Service (SaaS) solution. Monetization is tied to three core value drivers:
1. **Fleet Capacity Managed:** The number of active ambulances tracked, dispatched, and coordinated on the platform.
2. **Clinical Coordination Depth:** The level of real-time clinical telemetry streaming, early warning alerting, and hospital integration enabled.
3. **Institutional Scale & Governance:** Single-facility vs. multi-site network coordination, SLA auditing, and government command-and-control visibility.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TIERED ENTITLEMENT ARCHITECTURE                          │
├─────────────────┬──────────────────┬─────────────────┬──────────────────────┤
│ BASIC TIER      │ PROFESSIONAL     │ ENTERPRISE      │ GOVERNMENT / EMS     │
│ (Fleet Dispatch)│ (Hospital Pre-Arr│ (Hospital Nets) │ (Regional Oversight) │
├─────────────────┼──────────────────┼─────────────────┼──────────────────────┤
│ • GPS Tracking  │ • All Basic      │ • All Pro       │ • Jurisdiction View  │
│ • Mobile Driver │ • Live ED Screen │ • Multi-Hospital│ • Cross-Fleet Heatmap│
│ • Basic Dispatch│ • Dynamic ETA    │ • Central CAD   │ • Public CAD Bridge  │
│ • State Machine │ • Vitals & Alerts│ • Custom Roles  │ • SLA Audit Engine   │
│                 │ • Handover Flow  │ • SAML SSO      │ • MCI Disaster Mode  │
└─────────────────┴──────────────────┴─────────────────┴──────────────────────┘
        │                  │                 │                  │
        └──────────────────┴────────┬────────┴──────────────────┘
                                    │
                         OPTIONAL ADD-ON MODULES
            ┌───────────────────────┴───────────────────────┐
            │ • IoT Hardware Gateway Ingestion Module       │
            │ • Dedicated EHR / HIS Integration API (HL7)   │
            │ • Sovereign On-Premises / GovCloud Deployment │
            └───────────────────────────────────────────────┘
```

---

## 2. Subscription Tiers & Feature Entitlements

### Tier 1: Basic (Fleet Logistics Tier) `[PROPOSED]`
* **Target Customer:** Independent Fleet Owners, Small Commercial Operators (1 to 10 ambulances).
* **Primary Payer:** Fleet Owner / Managing Partner.
* **Core Entitlements:**
  - Real-time GPS vehicle tracking (Android beacon).
  - Basic Dispatcher Web Console.
  - Driver Mobile App (dispatch notification, 1-tap state progression, address navigation).
  - Basic mission history and mileage tracking.
  - Email support.
* **Excluded Entitlements:** Live receiving hospital ED dashboard, streaming vitals, automated early warning scores, multi-hospital routing.

### Tier 2: Professional (Clinical Coordination Tier) `[PROPOSED]`
* **Target Customer:** Private Hospitals with captive fleets; Commercial Operators with hospital contracts.
* **Primary Payer:** Hospital COO, Chief Medical Officer, or Commercial Fleet Director.
* **Core Entitlements:**
  - All features in Basic Tier.
  - **Live Emergency Department Pre-Arrival Dashboard:** Dynamic ETA countdown, incoming vehicle queue, audible arrival alerts.
  - **Pre-Hospital Clinical Telemetry:** Ingestion and display of patient vitals (manual EMT entry + simulated stream in MVP).
  - **Early Warning Scoring (NEWS2 / MEWS):** Automated clinical degradation flags.
  - **Standard Digital Handover Protocol:** Dual confirmation sign-off between crew and triage nurse.
  - Shift scheduling and crew-vehicle pairing.

### Tier 3: Enterprise (Hospital Network & Corporate Fleet Tier) `[PROPOSED]`
* **Target Customer:** Large Hospital Networks (multi-site health systems), Regional Corporate Fleet Operators.
* **Primary Payer:** Corporate Chief Information Officer (CIO) / VP of Operations.
* **Core Entitlements:**
  - All features in Professional Tier.
  - **Centralized Multi-Hospital Command Center:** Dynamic bed diversion status management, cross-facility load balancing.
  - **Advanced Multi-Tenancy Hierarchy:** Parent organization governing child hospital facilities and regional dispatch hubs.
  - **Granular RBAC & Enterprise Security:** Single Sign-On (SAML 2.0 / OIDC), enforced MFA, IP whitelisting.
  - **Tamper-Evident Medicolegal Audit Export:** Full immutable log extraction for legal and insurance defense.
  - Dedicated Account Manager & 99.95% uptime SLA.

### Tier 4: Government / EMS Authority Tier `[PROPOSED]`
* **Target Customer:** Municipal, State, or National Health Departments / 911 / 108 / 112 Public Emergency Authorities.
* **Primary Payer:** Ministry of Health, City Emergency Management Agency.
* **Core Entitlements:**
  - **Jurisdiction-Wide Situational Awareness Map:** Aggregated real-time visualization of all licensed public and contracted private ambulances.
  - **Objective Contract SLA Auditing:** Automated verification of mandated response times, travel times, and offload delays with penalty reports.
  - **Mass Casualty Incident (MCI) Command Mode:** Dynamic disaster zoning, triage tag tracking, and emergency hospital distribution.
  - High-volume data export pipelines for public health epidemiology.

---

## 3. Usage Dimensions & Cost Drivers
Platform monetization should measure and bill along dimensions that directly align with customer value and cloud infrastructure costs:

1. **Active Monitored Ambulances (Primary SaaS Dimension):** Billed monthly per active vehicle registered on the platform. Discourages phantom accounts while allowing predictable operational expense. `[PROPOSED]`
2. **Completed Missions (Alternative / Hybrid Dimension):** Useful for low-frequency independent operators or pay-per-use commercial agreements. `[PROPOSED]`
3. **Receiving Hospital Emergency Room Licenses:** Flat recurring facility fee for every emergency department operating a dedicated, active Pre-Arrival Receiving Screen. `[PROPOSED]`
4. **Data Ingestion Volume (IoT / High-Frequency Telemetry):** Surcharge applied if high-frequency waveform streaming (e.g., continuous 500Hz 12-lead ECG) exceeds standard cellular payload allowances. `[PROPOSED]`

---

## 4. Hardware Relationship & Strategy
To maximize market penetration and avoid vendor lock-in, the platform adopts a **hardware-neutral software approach**:
* **Zero Hardware Bundling Mandate:** Customers are not required to buy expensive proprietary in-vehicle terminals. The platform runs on standard commercial Android tablets and smartphones (Android 10+). `[CONFIRMED]`
* **Hardware Abstraction Layer (HAL):** Vehicle tracking can originate from either:
  1. The Driver's Android smartphone (Zero Capex).
  2. A dedicated vehicular OBD-II / telematics tracker (Teltonika, CalAmp) via standard cellular protocol.
* **Medical Device Ingestion:** Patient telemetry can be ingested via:
  1. Paramedic manual entry on mobile tablet (Zero Capex).
  2. Bluetooth Low Energy (BLE) / WiFi bridge to an in-vehicle IoT gateway (ESP32/STM32) connected to monitor serial outputs.
* **Hardware Certification Program (Optional Professional Service):** The platform operator offers testing and certification for third-party hardware modules, generating professional services revenue without taking on hardware manufacturing liabilities. `[PROPOSED]`

---

## 5. Enterprise Integrations & Professional Services (Add-Ons)
Enterprise customers typically require connectivity into pre-existing hospital IT infrastructure:
* **EHR / Hospital Information System (HIS) Connector:** Custom bidirectional integration with Epic, Cerner, or local hospital EHRs using HL7 FHIR standards (pushing ePCR and handover records directly into inpatient medical charts). `[PROPOSED]`
* **Computer-Aided Dispatch (CAD) Bridge:** Interfacing municipal 911/112 CAD software to automatically ingest emergency requests into the platform. `[PROPOSED]`
* **Implementation & Paramedic Training:** On-site simulation training, vehicle mount inspection, and dispatcher workflow optimization. `[PROPOSED]`

---

## 6. Government Deployment Considerations
When contracting with Government / EMS Authorities:
* **Sovereign Cloud & Data Residency:** Many public health authorities legally forbid hosting citizen emergency data on shared commercial public cloud infrastructure. The architecture must support deployment to Government Cloud regions (e.g., AWS GovCloud, Azure Government) or isolated sovereign clusters. `[CONFIRMED]`
* **Procurement Cycles:** Government deals involve 6-to-18-month procurement cycles, requiring specialized RFP documentation, performance bonds, and fixed multi-year budgeting rather than standard self-serve credit card subscriptions. `[ASSUMPTION]`
