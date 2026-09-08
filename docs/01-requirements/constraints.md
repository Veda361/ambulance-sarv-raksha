# System Constraints: Ambulance Coordination Platform

**Status:** APPROVED FOR PHASE 0  
**Enforcement:** Hard technical, physical, economic, and operational limitations that the architecture must obey.

---

## 1. Technical & Engineering Constraints

* **CST-001: Mobile Operating System Scope**  
  * *Constraint:* The mobile field client for drivers and EMTs shall target **Android 10 (API level 29) and higher**. iOS support is explicitly deferred. `[CONFIRMED]`  
  * *Rationale:* 95%+ of enterprise ruggedized tablets, in-vehicle mounts, and field driver phones in the target operating demographic are Android devices. Supporting iOS in Phase 1 introduces secondary build chains without commercial necessity.

* **CST-002: In-Transit Network Topology**  
  * *Constraint:* The system cannot rely on persistent, low-latency client-server TCP connections while vehicles are in motion. Every edge protocol must assume intermittent disconnection and high jitter. `[CONFIRMED]`  
  * *Rationale:* Cellular tower handoffs and physical urban canyons regularly disrupt active sockets.

* **CST-003: Memory & Compute Footprint on Edge**  
  * *Constraint:* The Android field application must operate within a constrained memory footprint (maximum 150MB heap allocation) and must not cause thermal throttling or rapid battery exhaustion when running continuously for 12-hour shifts. `[CONFIRMED]`  
  * *Rationale:* Ambulances operate in high ambient temperatures; overheating phones enter thermal shutdown, dropping critical tracking.

* **CST-004: Browser Compatibility for Web Dashboards**  
  * *Constraint:* Hospital and Dispatcher web consoles must operate seamlessly on modern Evergreen web browsers (Chrome >= 110, Firefox >= 110, Edge >= 110) without requiring proprietary browser extensions, Flash, or desktop binary installation. `[CONFIRMED]`  
  * *Rationale:* Hospital IT departments enforce locked-down enterprise desktops where staff cannot install unapproved local software.

---

## 2. Regulatory & Legal Constraints

* **CST-005: Clinical Decision Support Boundaries**  
  * *Constraint:* The platform must never provide autonomous clinical advice, automated triage overrides, or autonomous drug dosing recommendations. `[CONFIRMED]`  
  * *Rationale:* Violating this boundary triggers immediate re-classification as a high-risk Software as a Medical Device (SaMD), invalidating deployment without multi-year clinical trial certifications.

* **CST-006: Patient Health Information (PHI) Segregation**  
  * *Constraint:* Patient identifiable health information must be strictly isolated from vehicle operational logs. PHI must never appear in plaintext telemetry logs, crash reports, or external monitoring streams. `[CONFIRMED]`  
  * *Rationale:* Data protection laws require data minimization and technical safeguards against unauthorized exposure.

---

## 3. Operational & Human Factor Constraints

* **CST-007: Single-Handed Driver Ergonomics**  
  * *Constraint:* The driver mobile user interface must allow all critical driving-phase operations to be executed with a single tap on oversized targets (> 64dp) without requiring scrolling or keyboard input. `[CONFIRMED]`  
  * *Rationale:* Road safety regulations prohibit complex manual device operations while operating emergency motor vehicles.

* **CST-008: Zero-Installation External Hospital Links**  
  * *Constraint:* When a commercial ambulance transports a patient to a secondary receiving hospital that has not installed or subscribed to the platform, the hospital must be able to view pre-arrival telemetry via a secure, one-time authenticated web link accessible on any standard web browser. `[CONFIRMED]`  
  * *Rationale:* Unplanned emergency diversions frequently route to non-network hospitals where software cannot be pre-provisioned.
