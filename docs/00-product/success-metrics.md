# Success Metrics: Ambulance Coordination Platform

**Status:** APPROVED FOR PHASE 0  
**Metric Standard:** All metric targets are categorized as `[PROPOSED TARGET]` (to be calibrated during initial pilot deployments) or `[CONFIRMED SLA]` (engineering hard requirements).

---

## 1. Operational & Clinical Success Metrics

These metrics quantify the platform’s impact on field response speed, clinical preparation time, and operational efficiency:

| Metric ID | Operational Metric Name | Definition | Baseline (Current Analog) | Proposed Target | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **OP-001** | **Mission Creation Latency** | Time elapsed from initial call ingestion to mission saved in database. | 180 – 300 seconds (manual paper/phone) | < 45 seconds | `[PROPOSED TARGET]` |
| **OP-002** | **Dispatch Assignment Time** | Time from mission creation to vehicle assignment notification pushed to driver. | 120 – 240 seconds | < 15 seconds | `[PROPOSED TARGET]` |
| **OP-003** | **Driver Acknowledgement Time** | Time from driver device chime to driver tapping "ACCEPT". | Variable (often missed radio calls) | < 30 seconds (alert timeout at 45s) | `[PROPOSED TARGET]` |
| **OP-004** | **Pre-Arrival Notification Lead Time** | Duration before vehicle arrival that the hospital receives incoming patient clinical profile. | 0 – 3 minutes (or unannounced) | > 12 minutes (for transits > 15m) | `[PROPOSED TARGET]` |
| **OP-005** | **Dynamic ETA Accuracy** | Absolute variance between predicted arrival time (at midpoint) and actual arrival timestamp. | +/- 10 to 15 minutes | < 2.5 minutes variance | `[PROPOSED TARGET]` |
| **OP-006** | **ED Offload Delay ("Wall Time")** | Time elapsed from ambulance physical arrival at hospital to completed digital clinical handover. | 30 – 60 minutes | < 15 minutes | `[PROPOSED TARGET]` |
| **OP-007** | **Mission Completion Rate** | Percentage of initiated emergency missions successfully brought to valid completion. | ~85% (high untracked cancellations) | > 96% | `[PROPOSED TARGET]` |

---

## 2. Technical, Platform & SRE Metrics

These metrics define the software and infrastructure service level objectives (SLOs):

| Metric ID | Technical Metric Name | Definition / Measurement | MVP Minimum | Production SLA | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TECH-001** | **Platform Core API Availability** | Monthly uptime percentage of REST/GraphQL API endpoints. | 99.0% | 99.95% | `[CONFIRMED SLA]` |
| **TECH-002** | **Realtime Broadcast Latency** | Time from GPS/telemetry packet received by backend to update rendered on hospital web screen. | < 2,000 ms | < 500 ms (P95) | `[CONFIRMED SLA]` |
| **TECH-003** | **GPS Location Update Frequency** | Periodic interval of location transmission while vehicle is in active transit. | Every 5 seconds | Every 3 seconds (dynamic to 1s on approach) | `[PROPOSED TARGET]` |
| **TECH-004** | **Telemetry Ingestion Throughput** | Maximum supported sustained telemetry events per second per ingestion node. | 100 events/sec | 5,000 events/sec | `[PROPOSED TARGET]` |
| **TECH-005** | **Mobile Crash-Free Sessions** | Percentage of driver and EMT mobile app sessions without unhandled exceptions. | > 98.0% | > 99.8% | `[CONFIRMED SLA]` |
| **TECH-006** | **Offline Queue Sync Reliability** | Percentage of offline-cached telemetry points successfully delivered upon reconnection. | 99.0% | 99.99% (Zero dropped clinical events) | `[CONFIRMED SLA]` |
| **TECH-007** | **Notification Delivery Latency** | Time elapsed from mission dispatch trigger to high-priority FCM/APNS chime on driver phone. | < 5.0 seconds | < 1.8 seconds (P95) | `[CONFIRMED SLA]` |
| **TECH-008** | **Database Recovery Point Objective (RPO)** | Maximum tolerable transactional data loss in an unrecoverable zone outage. | < 15 minutes | < 1 minute | `[CONFIRMED SLA]` |

---

## 3. Commercial & Business Adoption Metrics

These metrics track platform sustainability, organizational engagement, and customer retention:

| Metric ID | Business Metric Name | Definition | Target Year 1 | Classification |
| :--- | :--- | :--- | :--- | :--- |
| **BIZ-001** | **Active Tenant Organizations** | Number of paid contracted customer entities (Hospitals, Fleets, Networks). | 25 organizations | `[PROPOSED TARGET]` |
| **BIZ-002** | **Monitored Active Ambulances** | Total active vehicles running the platform driver app or IoT gateway. | 250 vehicles | `[PROPOSED TARGET]` |
| **BIZ-003** | **Monthly Completed Missions** | Aggregate emergency and transfer missions coordinated end-to-end through the platform. | 10,000 missions/mo | `[PROPOSED TARGET]` |
| **BIZ-004** | **Fleet Utilization Rate** | Average hours per day an ambulance is engaged in active coordinated missions vs. idling. | > 35% improvement over baseline | `[PROPOSED TARGET]` |
| **BIZ-005** | **Net Revenue Retention (NRR)** | Expansion revenue from existing organizations upgrading tiers or adding ambulances. | > 115% | `[PROPOSED TARGET]` |
| **BIZ-006** | **Pilot-to-Paid Conversion Rate** | Percentage of hospital/fleet trial pilots that transition into long-term recurring contracts. | > 70% | `[PROPOSED TARGET]` |
