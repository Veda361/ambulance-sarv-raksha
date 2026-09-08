# Privacy Requirements & Data Protection Specification

**Status:** APPROVED FOR PHASE 0  
**Legal Notice:** This specification establishes technical privacy architecture. Formal compliance certifications (e.g., India DPDP Act 2023, ABDM M1/M2/M3, US HIPAA Security Rule, EU GDPR) are tagged `[REQUIRES LEGAL/COMPLIANCE REVIEW]`.

---

## 1. Privacy-by-Design Architecture

The platform separates data into three distinct security and privacy classifications:
1. **Protected Health Information (PHI):** Any clinical data that directly or indirectly identifies a patient (Name, Contact Number, National Health ID, Age, Gender, Chief Complaint, Diagnostic Observations, Physiological Waveforms).
2. **Operational Fleet Telematics:** Non-clinical physical data regarding vehicle movement (GPS Coordinates, Speed, Bearing, Fuel Level, Engine Diagnostic Codes, Shift Rosters).
3. **System Metadata & Audit Logs:** Internal system traces, user identifiers, role definitions, and access logs.

---

## 2. Structural Separation of PHI and Fleet Telematics

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DATA PRIVACY SEGREGATION                              │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ TIER 1: OPERATIONAL TELEMATICS       │ TIER 2: PROTECTED HEALTH INFO (PHI)  │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • Vehicle GPS & Speed                │ • Patient Full Name & Contact        │
│ • Milestone State Timestamps         │ • Emergency Chief Complaint          │
│ • Ambulance Maintenance Status       │ • Continuous Vitals (HR, SpO2, NIBP) │
│ • Driver Duty Hours                  │ • Clinical Handover Notes            │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ Storage: TimescaleDB / Redis Cache   │ Storage: PostgreSQL PHI Schema       │
│ Encryption: Volume AES-256           │ Encryption: Field-Level AES-256-GCM  │
│ Visibility: Dispatchers, Fleet Mgrs, │ Visibility: Authorized EMT &         │
│             Gov EMS Regulators       │             Receiving ER Clinicians  │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

* **Architectural Wall:** Operational users (e.g., commercial fleet managers, maintenance technicians, and government SLA monitors) can view real-time vehicle locations and response intervals, but are cryptographically and structurally blocked from viewing patient names, clinical notes, or vital signs.

---

## 3. Strict Patient Identifiable Data Safeguards

### 3.1 Zero PHI in Logs & Traces `[CONFIRMED]`
* Application loggers (Winston, Pino, Zap) must incorporate automated data-masking interceptors.
* Regular expressions automatically detect and redact potential PHI before writing to log streams:
  ```json
  {
    "timestamp": "2026-09-06T15:30:00Z",
    "event": "MISSION_PATIENT_UPDATED",
    "mission_id": "MSN-2026-00412",
    "patient_name": "[REDACTED_PHI]",
    "contact_phone": "[REDACTED_PHI]"
  }
  ```
* OpenTelemetry APM traces and error payloads delivered to Sentry must never contain unmasked patient demographics.

### 3.2 Transient Coordination Envelopes `[CONFIRMED]`
* When a patient is in transit to a receiving hospital, the hospital receives a transient, read-only **Mission Coordination Token**.
* Once the handover protocol is signed (`MISSION_COMPLETED`), the active WebSocket subscription terminates. The hospital can access the finalized clinical record through its secure medical records portal, but the live stream is permanently revoked.

---

## 4. Location Privacy & Obfuscation Policies

* **Driver Personal Privacy:** GPS tracking is strictly active only while an ambulance is in an active shift or assigned to a mission. When a driver clocks out or marks a vehicle as `OFF_DUTY`, the mobile background location provider is commanded to halt transmission. `[CONFIRMED]`
* **Pickup Location Privacy:** Pickup coordinates stored in operational mission tables are restricted to authorized dispatchers and assigned crew members. In aggregated public health reporting, pickup locations are generalized to 1 km² geospatial grid cells (H3 index resolution 7) to eliminate individual residential identification. `[PROPOSED]`

---

## 5. Data Retention, Purging & Medicolegal Archival

| Data Type | Active Online Retention | Cold Encrypted Archive | Deletion / Purging Policy | Compliance Reference |
| :--- | :--- | :--- | :--- | :--- |
| **High-Frequency GPS Breadcrumbs (3-5s points)** | 30 Days (Hot PostgreSQL / TimescaleDB) | 90 Days (Compressed S3 Parquet) | Permanently purged after 90 days; only start, arrival, and milestone coordinates retained in mission summary. | Storage Optimization & Privacy Minimization |
| **Operational Mission Summaries** | 2 Years | 5 Years | Archived to cold storage after 2 years. | Commercial Contract Auditing |
| **Clinical ePCR & Handover Records** | 1 Year (Immediate Retrieval) | 7 Years (Tamper-evident WORM Storage) | Retained for minimum 7 years per statutory requirements for emergency medical records. | `[REQUIRES LEGAL/COMPLIANCE REVIEW]` |
| **User Access & Security Audit Logs** | 1 Year | 3 Years | Archived to append-only compliance bucket. | Security Incident Reconstruction |
