# Domain Model: Ambulance Coordination Platform

**Status:** APPROVED FOR PHASE 0  
**Domain Core Principle:** The **Mission** is the central, first-class aggregate root connecting all operational, geospatial, and clinical sub-entities.

---

## 1. Domain Entity Relationship Diagram

```
┌─────────────────┐       1..* ┌─────────────────┐ 1      1..* ┌─────────────────┐
│  Organization   ├───────────►│    Hospital     ├────────────►│  HospitalArrival│
└────────┬────────┘            └─────────────────┘             └─────────────────┘
         │ 1
         ├────────────────────► 1..* [ User ] ◄───► [ Role / Permission ]
         │ 1
         ├────────────────────► 1..* [ Ambulance ] ◄───► [ Device / IoT ]
         │ 1                                ▲
         │                                  │ 1..* (Assigned)
         ▼ 1..*                             │
   ┌───────────┐ 1                   1..*   │
   │  Mission  ├────────────────────────────┘
   └─────┬─────┘
         │ 1
         ├──────────────► 1..1 [ Patient ] (PHI Encrypted)
         │ 1
         ├──────────────► 1..* [ MissionEvent ] (Immutable State History)
         │ 1
         ├──────────────► 1..* [ Location ] (Time-Series GPS Breadcrumbs)
         │ 1
         ├──────────────► 1..* [ VitalMeasurement ] (Time-Series Physiologicals)
         │ 1
         ├──────────────► 0..* [ Alert ] (NEWS2 & Clinical Triggers)
         │ 1
         ├──────────────► 0..* [ Notification ] (High-priority alerts pushed)
         │ 1
         └──────────────► 0..1 [ Handover ] (Medicolegal Sign-off)
```

---

## 2. Detailed Domain Entity Specifications

### 2.1 Organization
* **Purpose:** Represents the legal customer entity (Private Hospital, Hospital Network, Ambulance Fleet Operator, or Government EMS Authority).
* **Ownership:** Top-level tenant container.
* **Relationships:** Has many Hospitals, Ambulances, Users, Devices, Missions, Subscriptions.
* **Lifecycle:** `ACTIVE` ➔ `SUSPENDED` ➔ `ARCHIVED`.
* **Sensitive Data:** Commercial billing details, contract metadata.
* **Tenant Boundary:** Root boundary. All database entities inherit `tenant_id` from Organization.

### 2.2 User
* **Purpose:** A human individual interacting with the platform (Dispatcher, Driver, EMT, Admin, Triage Nurse).
* **Ownership:** Belongs to one or more Organizations.
* **Relationships:** Assigned one or more Roles; paired with Crew shifts and Missions.
* **Lifecycle:** `INVITED` ➔ `ACTIVE` ➔ `SUSPENDED` ➔ `DEACTIVATED`.
* **Sensitive Data:** Password hash, email, mobile phone, Government identification number.
* **Tenant Boundary:** Strictly scoped to `tenant_id`.

### 2.3 Role & Permission
* **Purpose:** Defines granular access entitlements (RBAC).
* **Ownership:** Platform-defined system roles + Organization-customizable roles.
* **Relationships:** Many-to-Many with Users and Permissions.
* **Lifecycle:** Static / Immutable system definitions.
* **Sensitive Data:** None.
* **Tenant Boundary:** System-wide or Tenant-scoped.

### 2.4 Hospital
* **Purpose:** Represents a physical healthcare facility with an emergency triage department.
* **Ownership:** Belongs to an Organization.
* **Relationships:** Has many HospitalArrivals; associated with Missions as origin or destination.
* **Lifecycle:** `ACTIVE` ➔ `DIVERSION` ➔ `INACTIVE`.
* **Sensitive Data:** Emergency contact direct lines, trauma capability flags.
* **Tenant Boundary:** Scoped to Organization `tenant_id`.

### 2.5 Ambulance (Vehicle)
* **Purpose:** Represents a physical emergency vehicle asset in a fleet.
* **Ownership:** Belongs to an Organization (Ambulance Operator or Hospital).
* **Relationships:** Paired with Devices (GPS tracker, IoT gateway); assigned to Missions; staffed by Crew.
* **Lifecycle:** `REGISTERED` ➔ `IN_SERVICE` ➔ `MAINTENANCE` ➔ `DECOMMISSIONED`.
* **Sensitive Data:** Vehicle registration number, telematics serial numbers.
* **Tenant Boundary:** Scoped to Organization `tenant_id`.

### 2.6 Crew (Shift Assignment)
* **Purpose:** Represents an operational crew roster pairing a Driver and an EMT to an Ambulance for a defined shift.
* **Ownership:** Belongs to Organization.
* **Relationships:** References 1 Ambulance, 1 Driver User, 0..* EMT Users.
* **Lifecycle:** `SCHEDULED` ➔ `ON_DUTY` ➔ `OFF_DUTY`.
* **Sensitive Data:** Duty hours, fatigue timestamps.
* **Tenant Boundary:** Scoped to Organization `tenant_id`.

### 2.7 Device (IoT Gateway / Medical Bridge)
* **Purpose:** Represents a hardware telemetry unit (Android phone, OBD-II tracker, ESP32 gateway).
* **Ownership:** Belongs to Organization; bound to an Ambulance.
* **Relationships:** Emits Locations and VitalMeasurements; linked to 1 Ambulance.
* **Lifecycle:** `PROVISIONED` ➔ `PAIRED` ➔ `OFFLINE` ➔ `REVOKED`.
* **Sensitive Data:** Hardware client certificates, private mTLS keys, device tokens.
* **Tenant Boundary:** Scoped to Organization `tenant_id`.

### 2.8 Patient
* **Purpose:** Represents the individual receiving pre-hospital emergency medical care.
* **Ownership:** Held in medical stewardship by the transporting healthcare organization.
* **Relationships:** Linked 1-to-1 with a Mission.
* **Lifecycle:** `CREATED` ➔ `MONITORED` ➔ `HANDED_OVER` ➔ `ARCHIVED`.
* **Sensitive Data:** **HIGH PHI:** Name, Age, Sex, Government Health ID, Medical History, Chief Complaint. Encrypted at rest.
* **Tenant Boundary:** Scoped to Mission; transiently shared with destination Hospital via Mission Coordination Envelope.

### 2.9 Mission (Central Aggregate Root)
* **Purpose:** The primary operational coordinating entity governing the emergency lifecycle from distress call to hospital handover.
* **Ownership:** Initiated by Organization; binds Ambulance, Crew, Patient, and Hospital.
* **Relationships:** Has 1 Patient, 1 Ambulance, 1 Driver, 0..* EMTs, 1 Destination Hospital, many Locations, many VitalMeasurements, many MissionEvents, 0..1 Handover.
* **Lifecycle:** Governed by the formal Mission State Machine (`REQUESTED` to `COMPLETED`).
* **Sensitive Data:** Aggregates pickup location, patient condition, route, and clinical notes.
* **Tenant Boundary:** Primary Organization owns mission; temporary cross-tenant access granted to receiving Hospital.

### 2.10 MissionEvent (Immutable Event Log)
* **Purpose:** Records every discrete state change, reassignment, or operational milestone.
* **Ownership:** Child of Mission.
* **Relationships:** Belongs to 1 Mission; references triggering User or System.
* **Lifecycle:** Append-only / Immutable.
* **Sensitive Data:** Operational timestamps, actor IDs, transition reason codes.
* **Tenant Boundary:** Inherits Mission boundary.

### 2.11 Location (Time-Series Telematics)
* **Purpose:** High-frequency geospatial breadcrumb emitted during transit.
* **Ownership:** Child of Mission and Ambulance.
* **Relationships:** Belongs to Mission; emitted by Device/Ambulance.
* **Lifecycle:** Ephemeral in cache (Redis) -> Hypertable time-series (TimescaleDB) -> Cold Parquet archive (S3).
* **Sensitive Data:** High-precision latitude/longitude coordinates.
* **Tenant Boundary:** Inherits Mission boundary.

### 2.12 VitalMeasurement (Time-Series Physiologicals)
* **Purpose:** Time-series physiological telemetry (HR, SpO2, NIBP, RR, Temp, EtCO2).
* **Ownership:** Child of Mission and Patient.
* **Relationships:** Belongs to Mission; references Patient; feeds NEWS2 Alert engine.
* **Lifecycle:** Appended every 3-5 seconds; aggregated for clinical handover.
* **Sensitive Data:** **HIGH PHI:** Physiological trends and medical alarms.
* **Tenant Boundary:** Inherits Mission boundary.

### 2.13 Alert
* **Purpose:** System-generated notification triggered by clinical degradation (NEWS2 >= 7) or operational SLA breach (unacknowledged dispatch > 45s).
* **Ownership:** Child of Mission.
* **Relationships:** Belongs to Mission; triggers Notifications to specific Roles.
* **Lifecycle:** `TRIGGERED` ➔ `ACKNOWLEDGED` ➔ `RESOLVED`.
* **Sensitive Data:** Alert severity and clinical trigger rationale.
* **Tenant Boundary:** Inherits Mission boundary.

### 2.14 Notification
* **Purpose:** An outbound message delivered over a specific channel (WebSocket, Push Notification / FCM, SMS).
* **Ownership:** Generated by System Alert or State Change.
* **Relationships:** Targeted to User, Device, or Hospital screen.
* **Lifecycle:** `QUEUED` ➔ `SENT` ➔ `DELIVERED` ➔ `FAILED`.
* **Sensitive Data:** Recipient phone/token, message excerpt.
* **Tenant Boundary:** Scoped to recipient User tenant.

### 2.15 HospitalArrival
* **Purpose:** Represents the geofence entry and physical docking of an ambulance at an emergency department.
* **Ownership:** Belongs to Hospital and Mission.
* **Relationships:** Child of Mission; references Hospital.
* **Lifecycle:** `APPROACHING` (<5 min) ➔ `DOCKED_AT_BAY` ➔ `DEPARTED`.
* **Sensitive Data:** Arrival timestamps, assigned trauma bay number.
* **Tenant Boundary:** Scoped to Hospital `tenant_id`.

### 2.16 Handover (Clinical Transfer of Care)
* **Purpose:** The formal, legally binding transfer of clinical responsibility from field EMT to hospital emergency staff.
* **Ownership:** Co-owned by Transporting Ambulance Organization and Receiving Hospital.
* **Relationships:** Terminal milestone of Mission; references EMT User and Hospital Receiving Nurse User.
* **Lifecycle:** `INITIATED` ➔ `ACKNOWLEDGED` ➔ `SIGNED` ➔ `SEALED`.
* **Sensitive Data:** **HIGH PHI & MEDICOLEGAL:** Clinical summary, drug dosages, nurse signature, handover timestamp.
* **Tenant Boundary:** Accessible by both originating and receiving tenants.

### 2.17 Subscription & FeatureEntitlement
* **Purpose:** Manages SaaS billing tiers, active vehicle quotas, and feature flags.
* **Ownership:** Belongs to Organization.
* **Relationships:** 1-to-1 with Organization; contains multiple FeatureEntitlements.
* **Lifecycle:** `TRIAL` ➔ `ACTIVE` ➔ `PAST_DUE` ➔ `CANCELLED`.
* **Sensitive Data:** Billing account IDs, contract limits.
* **Tenant Boundary:** Scoped to Organization `tenant_id`.

### 2.18 AuditLog (Platform-Wide Audit Trail)
* **Purpose:** Immutable compliance record of every administrative and security action on the platform.
* **Ownership:** Platform Governance Layer.
* **Relationships:** Scoped by `tenant_id` and `user_id`.
* **Lifecycle:** Append-only (WORM). Never updated or deleted.
* **Sensitive Data:** IP addresses, user agents, action names, state diffs.
* **Tenant Boundary:** Tenant-partitioned audit log.
