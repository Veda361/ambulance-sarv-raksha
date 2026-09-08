# System Assumptions Register

**Status:** APPROVED FOR PHASE 0  
**Classification Rule:** Every statement in this register is categorized into:  
- `[CONFIRMED]`: Empirically validated fact or established baseline.  
- `[ASSUMPTION]`: High-probability operational premise adopted for engineering, requiring formal tracking.  
- `[PROPOSED]`: Design proposal pending architecture team consensus.  
- `[REQUIRES VALIDATION]`: Operational condition requiring empirical field interview or hardware bench testing.  
- `[UNKNOWN]`: Unresolved technical or legal variable with no current working baseline.

---

## 1. Network & Telecommunications Assumptions

* **ASM-001:** `[ASSUMPTION]` Cellular connectivity along primary urban and suburban road corridors operates primarily on 4G/LTE or 5G, providing at least 256 kbps uplink bandwidth during active vehicle movement.
* **ASM-002:** `[ASSUMPTION]` Cellular dead-zones (complete signal loss) are common in rural passages, tunnels, and deep hospital basements, with average blackout durations ranging from 30 seconds to 5 minutes.
* **ASM-003:** `[CONFIRMED]` Cellular IP addresses assigned to mobile phones and IoT modems are carrier-grade NAT (CGNAT) dynamic IPs, meaning the backend cannot initiate direct inbound TCP connections to vehicles; all telemetry connections must be outbound client-to-cloud connections (WebSockets, MQTT, or HTTPS polling).
* **ASM-004:** `[REQUIRES VALIDATION]` Field reliability and packet loss rates of low-cost commercial SIM cards in ambulances when switching cellular base stations at vehicle speeds exceeding 80 km/h.

---

## 2. Hardware & Edge Device Assumptions

* **ASM-005:** `[ASSUMPTION]` Ambulance drivers will use dedicated, dashboard-mounted Android smartphones or 8-to-10-inch ruggedized Android tablets running Android 10 (API level 29) or higher with dedicated power delivery.
* **ASM-006:** `[ASSUMPTION]` The Android device maintains a clean GPS signal with a clear view of the sky through the vehicle windshield, yielding an average horizontal accuracy between 5 and 15 meters under normal atmospheric conditions.
* **ASM-007:** `[REQUIRES VALIDATION]` Vehicle cabin 12V cigarette-lighter power converters frequently produce electrical noise, transient voltage spikes, or loose mechanical contacts during high-speed emergency driving, requiring battery-backed devices.
* **ASM-008:** `[REQUIRES VALIDATION]` Medical monitors deployed in target regional ambulances (e.g., Mindray BeneHeart, Philips Tempus Pro, Zoll X Series) possess enabled external RS-232, USB, or Bluetooth data output ports without proprietary software encryption locks.

---

## 3. Operational & Human Workflow Assumptions

* **ASM-009:** `[CONFIRMED]` Drivers under code-3 emergency conditions (lights and sirens) cannot safely interact with complex multi-step touchscreens or read detailed textual paragraphs while driving.
* **ASM-010:** `[ASSUMPTION]` Paramedics or EMTs are present in the patient cabin during high-acuity ALS transports, but may be completely occupied with manual chest compressions or airway management, precluding manual typing during critical phases.
* **ASM-011:** `[CONFIRMED]` Hospital emergency triage desks have existing internet-connected desktop computers or tablets with modern web browsers (Chrome, Edge, Firefox) capable of running WebSocket-connected single-page applications.
* **ASM-012:** `[REQUIRES VALIDATION]` Hospital emergency department nurses will actively monitor a dedicated pre-arrival screen if an audible chime alerts them to high-acuity arrivals, rather than ignoring it as background noise (alert fatigue).

---

## 4. Organizational & Business Assumptions

* **ASM-013:** `[ASSUMPTION]` Private hospitals are willing to pay a recurring SaaS subscription if the platform demonstrably reduces patient handover delays and captures referral admissions within their catchment area.
* **ASM-014:** `[ASSUMPTION]` Commercial ambulance fleet operators will adopt the software to provide verified digital proof of service level agreements (SLAs) to their institutional hospital clients.
* **ASM-015:** `[PROPOSED]` The platform will initially be operated as a multi-tenant managed cloud service (SaaS) hosted in a regional cloud data center (e.g., AWS Mumbai / Azure India) before offering sovereign government deployments.

---

## 5. Regulatory & Legal Assumptions

* **ASM-016:** `[REQUIRES VALIDATION]` Pre-hospital telemetry transmission to receiving hospitals does not require FDA / CDSCO Medical Device Software certification as long as the software does not provide automated diagnostic conclusions or therapeutic advice.
* **ASM-017:** `[REQUIRES LEGAL/COMPLIANCE REVIEW]` Storing patient demographics, triage vitals, and handover signatures requires compliance with national data privacy mandates (e.g., India DPDP Act 2023, ABDM guidelines, or HIPAA Security Rule).
