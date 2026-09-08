# Project Context: Sarv Raksha Ambulance Platform

**Status:** RECONCILED WITH PHASE 0 CHARTER  
**Canonical Specifications:**
- [Product Charter](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/00-product/product-charter.md)
- [Problem Statement Taxonomy](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/00-product/problem-statement.md)
- [Target Customers](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/00-product/target-customers.md)
- [System Constraints](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/01-requirements/constraints.md)

---

## 1. Overview
The Sarv Raksha platform addresses critical systemic gaps in emergency medical services (EMS) and pre-hospital care. In regional medical ecosystems such as Jhansi and expanding Tier-2/Tier-3 healthcare networks, emergency response suffers from voice-only coordination, inaccurate transit times, and zero clinical visibility into the ambulance cabin prior to arrival at the emergency department.

The platform provides a real-time, multi-tenant coordination layer connecting field ambulances, emergency dispatchers, private and network hospitals, and regulatory authorities into a synchronized clinical continuum.

---

## 2. Key Stakeholders
1. **Patients:** The ultimate beneficiaries receiving accelerated pre-hospital emergency care and reduced trauma offload delays.
2. **Ambulance Crews (Drivers & EMTs):** Frontline operators equipped with mobile tools for single-tap milestone progression, traffic-aware navigation, and automated vitals transmission.
3. **Hospital Emergency Departments:** Triage doctors and trauma nurses receiving 10-15 minute pre-arrival warnings with live patient vital trajectories and calibrated dynamic ETAs.
4. **Emergency Dispatchers:** Central command operators coordinating fleet availability and matching vehicles to clinical urgency.
5. **Healthcare & Regulatory Leadership:** Hospital executives, fleet owners, and government health authorities auditing response SLAs and fleet productivity.

---

## 3. Primary Objectives
* **Response Time Optimization:** Reduce dispatch-to-scene latency through geospatial proximity matching and immediate high-priority driver alerting.
* **Eliminate Hospital "Surprise Arrivals":** Stream live location breadcrumbs and continuous physiological telemetry (HR, SpO2, NIBP) to receiving triage screens.
* **Deterministic Emergency Handover:** Standardize the medicolegal transfer of care between field paramedics and emergency room charge nurses.
* **Deterministic Operation Across Disconnections:** Guarantee zero data loss during cellular blackouts via local SQLite store-and-forward edge caching.

---

## 4. Operating Constraints
* **Cellular Network Jitter:** Intermittent connectivity in rural highways, tunnels, and concrete emergency bays requires an offline-first mobile architecture.
* **Edge Hardware Constraints:** 150MB memory envelope on Android field tablets to prevent thermal throttling under continuous 12-hour shifts.
* **Non-Diagnostic Boundary:** The platform acts strictly as an emergency communication and telemetry relay system; it does not perform autonomous medical diagnosis or clinical treatment control.
