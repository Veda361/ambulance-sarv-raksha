# Target Customers: Ambulance Coordination Platform

**Status:** APPROVED FOR PHASE 0  
**Classification System:** `[CONFIRMED]`, `[ASSUMPTION]`, `[PROPOSED]`, `[REQUIRES VALIDATION]`.

---

## 1. Customer Segmentation Architecture
The platform is designed as a multi-tenant business-to-business (B2B) and business-to-government (B2G) software platform. It serves five distinct customer classes with differing organizational hierarchies, commercial incentives, operational workflows, and data boundary requirements.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CUSTOMER SEGMENT TAXONOMY                             │
├───────────────────────────────┬─────────────────────────────┬───────────────┤
│ HEALTHCARE PROVIDERS          │ FLEET OPERATORS             │ PUBLIC SECTOR │
├───────────────┬───────────────┼──────────────┬──────────────┼───────────────┤
│ Private       │ Hospital      │ Ambulance    │ Independent  │ Government /  │
│ Hospital      │ Network       │ Operator     │ Fleet        │ EMS Authority │
│ (Single Site) │ (Multi-Site)  │ (Commercial) │ (Small/SMB)  │ (Regional/Gov)│
└───────────────┴───────────────┴──────────────┴──────────────┴───────────────┘
```

---

## 2. Customer Profiles

### 2.1 Customer Type 1: Private Hospital (Single-Site Tertiary / Specialty)
* **Organization Type:** Single-facility private hospital with dedicated emergency department, ICU, and captive ambulance fleet (3 to 15 vehicles). `[CONFIRMED]`
* **Economic Buyer:** Chief Executive Officer (CEO), Chief Operating Officer (COO), or Medical Director. `[ASSUMPTION]`
* **System Operator:** Head of Emergency Medicine / Chief of Triage / Operations Manager. `[CONFIRMED]`
* **End Users:** Hospital Dispatcher, Emergency Triage Nurses, ER Attending Physicians, Captive Ambulance Drivers. `[CONFIRMED]`
* **Primary Pain Points:**
  - High-acuity cardiac/trauma cases arrive unannounced, creating chaos in resuscitation suites. `[CONFIRMED]`
  - Underutilized hospital-owned ambulances idling while private competitor fleets bring patients to other facilities. `[CONFIRMED]`
  - Lack of visibility into vehicle return times for planned inter-facility transfers. `[CONFIRMED]`
* **Value Received:**
  - 10–15 minute clinical pre-warning window enabling trauma/cath-lab mobilization. `[CONFIRMED]`
  - Higher patient retention within the hospital's catchment area. `[ASSUMPTION]`
  - Auditable turnaround metrics reducing ED offload delay. `[CONFIRMED]`
* **Likely Deployment Model:** Multi-tenant SaaS (Dedicated Tenant within Shared Public Cloud / Regional Cluster). `[PROPOSED]`
* **Likely Monetization Model:** Monthly SaaS subscription tiered by number of monitored ambulances + fixed hospital emergency room license. `[PROPOSED]`
* **Data Ownership Considerations:** Hospital strictly owns all clinical records (vitals, ePCR, patient identity). Vehicle telemetry is owned by the hospital. `[CONFIRMED]`
* **Required Features:** Live Pre-Arrival ED Dashboard, Dynamic ETA calculations, Automated Early Warning Score alerts, Driver Mobile App, Basic Fleet Dispatch. `[CONFIRMED]`

---

### 2.2 Customer Type 2: Hospital Network (Multi-Site Healthcare System)
* **Organization Type:** Corporate healthcare enterprise operating 3 to 50+ geographically distributed hospitals with centralized command-center dispatch. `[CONFIRMED]`
* **Economic Buyer:** Corporate Chief Information Officer (CIO), Chief Medical Officer (CMO), or VP of Supply Chain & Operations. `[ASSUMPTION]`
* **System Operator:** Central Dispatch Operations Director / Centralized Command Center Lead. `[CONFIRMED]`
* **End Users:** Centralized Dispatchers, Facility-level Triage Leads, Central Fleet Logistics Managers, Medical Directors. `[CONFIRMED]`
* **Primary Pain Points:**
  - Inability to balance emergency bed load across regional hospitals during capacity spikes. `[CONFIRMED]`
  - Fragmented dispatch systems across different cities/sites creating administrative overhead. `[CONFIRMED]`
  - Inefficient transfer of critically ill patients between peripheral satellite units and apex super-specialty hospitals. `[CONFIRMED]`
* **Value Received:**
  - Enterprise-wide fleet and facility load-balancing via unified command-center console. `[CONFIRMED]`
  - Standardized clinical handover protocol across all network sites. `[CONFIRMED]`
  - Cross-hospital transfer analytics driving systemic operational efficiency. `[CONFIRMED]`
* **Likely Deployment Model:** Multi-tenant SaaS with Enterprise Organization tier (Parent Org managing multiple Child Hospital entities with scoped role delegation). `[PROPOSED]`
* **Likely Monetization Model:** Enterprise contract with base platform license + per-hospital and per-vehicle tiered pricing + dedicated enterprise SLA. `[PROPOSED]`
* **Data Ownership Considerations:** Corporate entity owns aggregated metrics and operational telemetry. Patient clinical data is segregated by regional hospital operating legal entities to satisfy cross-jurisdiction privacy standards. `[REQUIRES LEGAL/COMPLIANCE REVIEW]`
* **Required Features:** Multi-hospital routing engine, Facility diversion status management, Centralized fleet allocation, Enterprise Role-Based Access Control (RBAC), SSO integration (SAML/OIDC). `[CONFIRMED]`

---

### 2.3 Customer Type 3: Ambulance Operator (Commercial Fleet Provider)
* **Organization Type:** Independent for-profit emergency transport company operating a dedicated fleet (10 to 100+ vehicles) contracted by hospitals, insurers, or corporate clients. `[CONFIRMED]`
* **Economic Buyer:** Managing Director / Fleet Owner / Head of Commercial Operations. `[ASSUMPTION]`
* **System Operator:** Fleet Dispatch Manager / Operations Supervisor. `[CONFIRMED]`
* **End Users:** Commercial Dispatchers, Hired Drivers, Paramedics. `[CONFIRMED]`
* **Primary Pain Points:**
  - SLA breach penalties due to slow vehicle allocation and manual driver phone calling. `[CONFIRMED]`
  - High fuel costs, vehicle wear-and-tear, and driver time leakage due to suboptimal routing. `[CONFIRMED]`
  - Inability to prove contractual compliance or delivery milestones to client hospitals. `[CONFIRMED]`
* **Value Received:**
  - Algorithmic dispatch matching the nearest available, appropriately equipped ambulance. `[CONFIRMED]`
  - Automated digital timestamps for contract billing (assigned, accepted, en-route, arrived, completed). `[CONFIRMED]`
  - Fuel and route audit trails reducing unauthorized vehicle usage. `[CONFIRMED]`
* **Likely Deployment Model:** Multi-tenant SaaS (Ambulance Operator Tenant without embedded hospital ER dashboards, but with external hospital notification links). `[PROPOSED]`
* **Likely Monetization Model:** Per-vehicle per-month subscription or per-completed-mission transaction fee. `[PROPOSED]`
* **Data Ownership Considerations:** Operator owns vehicle telemetry, driver performance data, and maintenance records. Operator DOES NOT own patient clinical data; clinical data is transiently relayed to the destination hospital and purged or encrypted per data retention policies. `[CONFIRMED]`
* **Required Features:** Fleet dispatch console, Driver mobile app, SLA timestamp verification, External hospital notification link generator, Driver roster and shift management. `[CONFIRMED]`

---

### 2.4 Customer Type 4: Government / EMS Authority (Public Health / Municipal)
* **Organization Type:** Municipal, regional, or national emergency service agency (e.g., 108/112/911 service authority) overseeing public emergency response. `[CONFIRMED]`
* **Economic Buyer:** Ministry/Department of Health, Municipal Commissioner, or Director of Public Safety. `[ASSUMPTION]`
* **System Operator:** Emergency Medical Services (EMS) Command & Control Center Director. `[CONFIRMED]`
* **End Users:** 911/112 Call Takers, Public EMS Dispatchers, Regional Medical Directors, Disaster Coordination Officers. `[CONFIRMED]`
* **Primary Pain Points:**
  - No unified situational awareness across public and private ambulances during regional emergencies or mass-casualty incidents (MCIs). `[CONFIRMED]`
  - Public frustration and political scrutiny over inequitable response times in rural/semi-urban zones. `[CONFIRMED]`
  - Manual, falsifiable paper reporting from contracted service providers. `[CONFIRMED]`
* **Value Received:**
  - Comprehensive regional emergency response visibility across public and contracted private fleets. `[CONFIRMED]`
  - Objective, tamper-evident metric collection for regulatory auditing and public resource planning. `[CONFIRMED]`
  - Dynamic disaster-response coordination layer. `[CONFIRMED]`
* **Likely Deployment Model:** Dedicated Government Cloud instance or sovereign on-premises/hybrid deployment adhering to national data residency mandates. `[PROPOSED]`
* **Likely Monetization Model:** Multi-year government procurement contract with capital expenditure (deployment/customization) and recurring operational maintenance (SLA support). `[PROPOSED]`
* **Data Ownership Considerations:** Government authority claims sovereign jurisdiction over all anonymized emergency operational metrics and public healthcare data. High-security data classification. `[REQUIRES LEGAL/COMPLIANCE REVIEW]`
* **Required Features:** Command-and-control emergency map, Regional heatmaps, Public call-taker integration (CAD), Multi-agency mutual aid coordination, Open regulatory reporting API. `[CONFIRMED]`

---

### 2.5 Customer Type 5: Independent Fleet (Small Fleet / Community Provider)
* **Organization Type:** Small-scale ambulance provider (1 to 5 vehicles) operated by local NGOs, philanthropic trusts, or individual owner-drivers. `[CONFIRMED]`
* **Economic Buyer:** Fleet Owner / NGO Trustee / Managing Partner. `[ASSUMPTION]`
* **System Operator:** Often the owner-driver or a single dedicated phone coordinator. `[CONFIRMED]`
* **End Users:** Driver-operator, Volunteer EMT. `[CONFIRMED]`
* **Primary Pain Points:**
  - High barrier to entry for expensive proprietary dispatch software. `[CONFIRMED]`
  - Receiving hospitals treat them as "walk-ins" without any pre-arrival preparation or priority triage. `[CONFIRMED]`
  - Disorganized record-keeping causing delayed reimbursements or charity grant reporting. `[ASSUMPTION]`
* **Value Received:**
  - Turnkey, low-cost mobile-first dispatch solution requiring zero server infrastructure. `[CONFIRMED]`
  - Professionalized digital pre-arrival notification to tertiary receiving hospitals. `[CONFIRMED]`
  - Simplified digital record of all transported cases. `[CONFIRMED]`
* **Likely Deployment Model:** Self-service multi-tenant SaaS (Entry-level tier). `[PROPOSED]`
* **Likely Monetization Model:** Low-cost monthly subscription per vehicle (freemium or micro-SaaS pricing). `[PROPOSED]`
* **Data Ownership Considerations:** Operator owns vehicle records. Patient data is transiently handled and securely passed to the receiving hospital. `[CONFIRMED]`
* **Required Features:** Simplified mobile dispatch, Native Android driver app, Instant one-time hospital pre-arrival link via SMS/WhatsApp/Web. `[CONFIRMED]`

---

## 3. Cross-Segment Comparative Matrix

| Attribute | Private Hospital | Hospital Network | Ambulance Operator | Government / EMS | Independent Fleet |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Fleet Scale** | 3 – 15 | 20 – 200+ | 10 – 100+ | 50 – 1,000+ | 1 – 5 |
| **Primary Goal** | Patient intake & pre-arrival prep | Network load-balancing & governance | Fleet efficiency & SLA proof | Regional equity & disaster control | Low-cost digital operations |
| **Clinical Telemetry Need** | High (Direct to ED) | High (Network-wide standard) | Low / Pass-through | Medium (Aggregated severity) | Basic / Pass-through |
| **SaaS Billing Tier** | Professional | Enterprise | Professional / Fleet | Government Custom | Basic / Self-service |
| **Deployment Boundary** | Shared Cloud (Tenant) | Shared Cloud (Enterprise Tenant) | Shared Cloud (Tenant) | Sovereign / Dedicated Gov Cloud | Shared Cloud (Tenant) |
