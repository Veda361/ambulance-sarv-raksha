# Architecture Diagrams Specification

**Status:** APPROVED FOR PHASE 0  
**Notice:** All diagrams represent concrete architectural components, boundaries, and data flows.

---

## 1. System Context Diagram (C4 Context)

```mermaid
C4Context
    title System Context: Ambulance Coordination Platform

    Person(driver, "Ambulance Driver", "Field operator navigating vehicle and updating transit milestones")
    Person(paramedic, "EMT / Paramedic", "Clinical caregiver monitoring patient vitals and executing handover")
    Person(dispatcher, "Emergency Dispatcher", "Triage intake operator managing vehicle assignments")
    Person(triageNurse, "Hospital Triage Team", "Emergency department staff receiving inbound patient data")
    Person(govSupervisor, "EMS / Gov Authority", "Public safety monitor auditing regional response times")

    Enterprise_Boundary(b0, "Ambulance Coordination Platform") {
        System(corePlatform, "Ambulance Coordination Core", "Orchestrates missions, state machine, telematics ingestion, and clinical alerts")
    }

    System_Ext(mapsApi, "Geocoding & Maps Service", "Google Maps / OSRM routing and reverse geocoding")
    System_Ext(fcm, "Push Notification Service", "Firebase Cloud Messaging (FCM) high-priority alerts")
    System_Ext(hospitalHis, "Hospital EHR / HIS", "Inpatient electronic health record systems (Future)")
    System_Ext(iotMonitors, "Ambulance IoT & Vitals Monitors", "Physical monitors (Mindray, Philips) & OBD-II trackers")

    Rel(driver, corePlatform, "Streams GPS, accepts missions, updates state", "HTTPS / WSS")
    Rel(paramedic, corePlatform, "Enters triage, reviews vitals, signs handover", "HTTPS / WSS")
    Rel(dispatcher, corePlatform, "Creates missions, assigns ambulances", "HTTPS / WSS")
    Rel(triageNurse, corePlatform, "Monitors live radar, receives vital alerts", "HTTPS / WSS")
    Rel(govSupervisor, corePlatform, "Reviews SLA compliance & regional heatmaps", "HTTPS")

    Rel(corePlatform, mapsApi, "Fetches routes & geocoding", "HTTPS / REST")
    Rel(corePlatform, fcm, "Dispatches driver alert chimes", "HTTPS")
    Rel(corePlatform, hospitalHis, "Exports completed ePCR & handover", "HL7 FHIR")
    Rel(iotMonitors, corePlatform, "Streams vitals & vehicle OBD-II telemetry", "MQTT / mTLS")
```

---

## 2. High-Level Container Architecture (C4 Container)

```mermaid
flowchart TD
    subgraph Clients ["Edge & Web Clients"]
        AndroidApp["Ambulance Android App\n(Kotlin + Room DB + Background GPS)"]
        HospitalWeb["Hospital Web Portal\n(React + Vite SPA)"]
        DispatchWeb["Dispatcher & Admin Portal\n(React + Vite SPA)"]
        IoTDevice["In-Vehicle IoT Gateway\n(ESP32 / OBD-II / Medical Bridge)"]
    end

    subgraph Ingestion ["Ingestion & Edge Gateway"]
        Gateway["Traefik / Nginx API Gateway\n(TLS 1.3 Termination, WAF, Rate Limiting)"]
    end

    subgraph CorePlatform ["Core Platform (Modular Monolith)"]
        AuthModule["Identity & Auth Module\n(OAuth2, JWT, RLS Claims)"]
        MissionFSM["Mission Lifecycle & FSM\n(State Engine)"]
        DispatchEngine["Dispatch & Geospatial Matcher\n(PostGIS + H3)"]
        ClinicalAlerts["Clinical Alerting & NEWS2\n(Deterministic Rules Engine)"]
        AuditEngine["Tamper-Evident Audit Journal\n(Append-Only)"]
    end

    subgraph RealtimeBackplane ["Realtime Messaging Backplane"]
        RedisCluster["Redis Cluster\n(Pub/Sub, WebSocket Session Bus, Ingest Cache)"]
    end

    subgraph StorageLayer ["Persistence & Storage Tier"]
        PostgresDB[("Primary Relational DB\nPostgreSQL 16 + PostGIS\n(Multi-Tenant RLS)")]
        TimescaleDB[("Time-Series Hypertable\nTimescaleDB Extension\n(GPS & Vitals Telemetry)")]
        S3Storage[("Encrypted Object Storage\nS3 / MinIO\n(ECG Traces, Handover Signatures)")]
    end

    AndroidApp -->|HTTPS / WSS| Gateway
    HospitalWeb -->|WSS / HTTPS| Gateway
    DispatchWeb -->|HTTPS / WSS| Gateway
    IoTDevice -->|MQTT / HTTPS| Gateway

    Gateway --> AuthModule
    Gateway --> MissionFSM
    Gateway --> DispatchEngine
    Gateway --> ClinicalAlerts

    MissionFSM <--> RedisCluster
    ClinicalAlerts <--> RedisCluster
    DispatchEngine <--> PostgresDB
    MissionFSM --> PostgresDB
    MissionFSM --> AuditEngine
    AuditEngine --> PostgresDB
    ClinicalAlerts --> TimescaleDB
    AndroidApp -.->|Uploads ECG| S3Storage
```

---

## 3. Organization Hierarchy & Multi-Tenancy Boundary

```mermaid
flowchart TD
    PlatformSuperAdmin["Platform Super Admin\n(Infrastructure & Tenant Provisioning)"]

    subgraph Tenant1 ["Tenant A: Private Hospital Network"]
        OrgAdminA["Organization Admin A"]
        Hospital1["Hospital Facility 1\n(Apex Tertiary)"]
        Hospital2["Hospital Facility 2\n(Peripheral Trauma)"]
        FleetA["Captive Ambulance Fleet\n(Ambulance 01, 02, 03)"]
        OrgAdminA --> Hospital1
        OrgAdminA --> Hospital2
        OrgAdminA --> FleetA
    end

    subgraph Tenant2 ["Tenant B: Commercial Ambulance Operator"]
        OrgAdminB["Organization Admin B"]
        FleetB["Commercial Fleet\n(Ambulance 101 - 120)"]
        CommercialDispatch["Commercial Dispatch Desk"]
        OrgAdminB --> FleetB
        OrgAdminB --> CommercialDispatch
    end

    subgraph Tenant3 ["Tenant C: Government / EMS Authority"]
        GovAdmin["EMS Jurisdiction Director"]
        CityEOC["Municipal Command & Control"]
        GovAdmin --> CityEOC
    end

    PlatformSuperAdmin -.->|Provisions| Tenant1
    PlatformSuperAdmin -.->|Provisions| Tenant2
    PlatformSuperAdmin -.->|Provisions| Tenant3

    FleetB -.->|Dispatched to Transport to| Hospital1
    note["Strict Logical Separation:\nTenant B cannot access Tenant A internal records.\nCross-tenant communication exists purely via\ntransient Mission Coordination Envelopes."]
```

---

## 4. Mission Lifecycle State Diagram

```mermaid
stateDiagram-v2
    [*] --> REQUESTED: Caller requests emergency transit
    REQUESTED --> DISPATCHING: System / Dispatcher initiates search
    DISPATCHING --> ASSIGNED: Ambulance & Crew assigned
    ASSIGNED --> REJECTED: Driver declines OR 45s timeout expires
    REJECTED --> ASSIGNED: Reassigned to alternative ambulance
    ASSIGNED --> ACCEPTED: Driver taps ACCEPT MISSION
    ACCEPTED --> EN_ROUTE_TO_PICKUP: Vehicle moves toward scene
    EN_ROUTE_TO_PICKUP --> ARRIVED_PICKUP: Ambulance arrives at scene
    ARRIVED_PICKUP --> PATIENT_ONBOARD: Patient loaded & vitals connected
    PATIENT_ONBOARD --> EN_ROUTE_TO_HOSPITAL: Departing scene for hospital
    EN_ROUTE_TO_HOSPITAL --> ARRIVED_HOSPITAL: Ambulance docks at emergency bay
    ARRIVED_HOSPITAL --> HANDOVER: Patient wheeled to trauma bay / triage
    HANDOVER --> COMPLETED: Dual nurse-paramedic digital sign-off
    COMPLETED --> [*]

    REQUESTED --> CANCELLED: Call aborted
    DISPATCHING --> CANCELLED: Call aborted
    ASSIGNED --> CANCELLED: Call aborted
    ACCEPTED --> CANCELLED: Call aborted
    EN_ROUTE_TO_PICKUP --> CANCELLED: Call aborted
    ARRIVED_PICKUP --> CANCELLED: Patient DOA / Refusal
    PATIENT_ONBOARD --> CANCELLED: Diverted by emergency authority
    CANCELLED --> [*]
```

---

## 5. Ambulance-to-Backend Data Flow (Telemetry Pipeline)

```mermaid
sequenceDiagram
    autonumber
    participant App as Android Driver App
    participant GW as API Gateway / Ingestion
    participant Redis as Redis Pub/Sub & Cache
    participant Core as Mission & Location Module
    participant TS as TimescaleDB / PostGIS
    participant Web as Hospital ED Screen

    App->>GW: POST /telemetry/location (Lat, Lon, Bearing, Speed, SeqNo)
    GW->>Core: Validate JWT Token & Tenant Scoping
    Core->>Core: Deduplicate by (AmbulanceID, SeqNo)
    Core->>Redis: Update Hot Vehicle Location & Cache
    Core->>Redis: Publish EVENT:LOCATION_UPDATED
    Redis-->>Web: Push WebSocket Location Delta & Recalculated ETA
    Core->>TS: Batch Async Insert into TimescaleDB Hypertable
    GW-->>App: HTTP 200 OK (Ack SeqNo)
```

---

## 6. Patient Vitals Ingestion & Clinical Alert Pipeline

```mermaid
sequenceDiagram
    autonumber
    participant Sensor as IoT Monitor / Vitals Simulator
    participant Ingest as Clinical Ingestion Gateway
    participant Engine as NEWS2 Rules Engine
    participant Audit as Append-Only Audit Store
    participant Push as WebSocket & FCM Alert Dispatcher
    participant Screen as Receiving Hospital Triage Screen

    Sensor->>Ingest: POST /telemetry/vitals (HR, SpO2, BP, RR, Temp)
    Ingest->>Engine: Ingest Time-Series Vital Packet
    Engine->>Engine: Evaluate NEWS2 Rules (e.g. SpO2=88% -> Score=3, Total=8)
    alt NEWS2 >= 7 (High Clinical Acuity)
        Engine->>Audit: Record Critical Alert Event (Immutable)
        Engine->>Push: Trigger High-Priority Emergency Broadcast
        Push->>Screen: WebSocket Push: CRITICAL_ALERT (Audio Alarm + Red Flash)
        Screen->>Screen: Display Inbound Critical Trauma Card (ETA 8 mins)
    else NEWS2 Normal (< 5)
        Engine->>Screen: WebSocket Push: Routine Vital Trend Update
    end
```

---

## 7. Hospital Pre-Arrival Coordination Flow

```mermaid
sequenceDiagram
    autonumber
    participant Driver as Ambulance Driver / EMT
    participant FSM as Mission Core FSM
    participant Hospital as Receiving Hospital ED Dashboard
    participant TraumaTeam as Hospital Trauma / Cath Lab Team

    Driver->>FSM: Tap "PATIENT ONBOARD" & "EN ROUTE TO HOSPITAL"
    FSM->>Hospital: WebSocket Event: INBOUND_AMBULANCE_EN_ROUTE
    Hospital->>Hospital: Mount Inbound Radar Card (Dynamic ETA: 14 mins)
    
    loop Every 5 Seconds in Transit
        Driver->>FSM: Continuous GPS & Vitals Stream
        FSM->>Hospital: Dynamic ETA Countdown & Live Vital Strip
    end

    Note over Hospital,TraumaTeam: ETA < 10 mins & Critical Acuity Triggered
    Hospital->>TraumaTeam: Charge Nurse clicks "ACTIVATE TRAUMA BAY 1"
    TraumaTeam->>TraumaTeam: Mobilize Surgical Team & Hold CT Scanner
    
    Driver->>FSM: Tap "ARRIVED HOSPITAL" (Within Geofence)
    FSM->>Hospital: Audio Chime: "Ambulance Arrived at Emergency Bay"
    Hospital->>Driver: Display Handover Modal on Tablet & Workstation
```

---

## 8. Authentication & Authorization Boundary

```mermaid
flowchart LR
    subgraph PublicUntrusted ["Public Internet / Cellular"]
        ClientUser["User / Mobile Client"]
        IoTDevice["IoT Telematics Device"]
    end

    subgraph SecurityBoundary ["Security & Gateway Layer"]
        WAF["WAF & DDoS Shield"]
        TLS["TLS 1.3 Termination"]
        AuthZ["JWT & mTLS Validator"]
    end

    subgraph InternalIsolated ["Internal Platform Cluster"]
        TenantContext["Tenant Context Injector\n(Injects tenant_id into Context)"]
        RBAC["RBAC Authorizer\n(Evaluates Role vs Resource)"]
        ServiceLayer["Domain Services"]
        RLS["PostgreSQL Row-Level Security\n(SET LOCAL app.current_tenant)"]
    end

    ClientUser -->|Bearer JWT| WAF --> TLS --> AuthZ
    IoTDevice -->|Client Cert mTLS| WAF --> TLS --> AuthZ

    AuthZ --> TenantContext
    TenantContext --> RBAC
    RBAC --> ServiceLayer
    ServiceLayer --> RLS
```

---

## 9. Multi-Tenant Data Boundary & Cross-Tenant Coordination

```mermaid
flowchart TD
    subgraph DataPartitioning ["PostgreSQL Database Cluster"]
        subgraph TenantA_Data ["Tenant A Data (Hospital Alpha)"]
            HospitalAlpha["Hospital Profile Alpha"]
            FleetAlpha["Alpha Captive Ambulances"]
            MissionsAlpha["Alpha Internal Missions"]
        end

        subgraph TenantB_Data ["Tenant B Data (Commercial Operator Beta)"]
            FleetBeta["Beta Commercial Ambulances"]
            DriversBeta["Beta Drivers & Shifts"]
            MissionsBeta["Beta Contract Missions"]
        end

        subgraph CrossTenantScope ["Mission Coordination Envelope (Scoped Dynamic View)"]
            Mission104["Mission #104 (Transit to Hospital Alpha)"]
            ScopedGPS["Live GPS & ETA (Ambulance Beta-04)"]
            ScopedVitals["Patient Vitals (Patient X)"]
        end
    end

    HospitalAlpha -.->|Normal Queries Scoped by tenant_id| TenantA_Data
    FleetBeta -.->|Normal Queries Scoped by tenant_id| TenantB_Data

    HospitalAlpha ==>|Temporary Read Access via Coordination Token| CrossTenantScope
    FleetBeta ==>|Owns & Feeds Telemetry to| CrossTenantScope
```

---

## 10. MVP End-to-End Sequence Diagram (The Golden Path)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Hospital Admin / Dispatcher
    actor Driver as Ambulance Driver
    actor Nurse as Receiving Hospital Triage Nurse
    participant Platform as Ambulance Coordination Platform
    participant Sim as Vitals Simulator Engine

    Admin->>Platform: 1. Create Mission (Pickup Pin, Trauma Urgency, Dest: Apex Hospital)
    Platform->>Platform: 2. State: REQUESTED -> DISPATCHING -> ASSIGNED
    Platform->>Driver: 3. High-Priority Push Notification: "New Emergency Mission"
    Driver->>Platform: 4. Driver taps "ACCEPT MISSION" (State: ACCEPTED -> EN_ROUTE_PICKUP)
    
    loop Active Transit to Pickup
        Driver->>Platform: 5. Background GPS coordinates streamed every 3s
        Platform->>Admin: 6. Live ambulance marker moving on Dispatch map
    end

    Driver->>Platform: 7. Driver taps "ARRIVED PICKUP" -> "PATIENT ONBOARD"
    Platform->>Sim: 8. Trigger Vitals Simulation (Scenario: Acute Hypoxia)
    Sim->>Platform: 9. Stream Vitals: HR 126 bpm, SpO2 87%, BP 90/60 mmHg
    Platform->>Platform: 10. NEWS2 Score calculated = 8 (High Alert)
    Platform->>Nurse: 11. WebSocket Alert: Pre-Arrival Radar Card (ETA 9m, High Acuity)
    Nurse->>Nurse: 12. Nurse prepares Resuscitation Bay 1
    
    Driver->>Platform: 13. Driver taps "ARRIVED HOSPITAL" (State: ARRIVED_HOSPITAL)
    Nurse->>Platform: 14. Nurse opens Handover Screen & acknowledges patient receipt
    Driver->>Platform: 15. Driver confirms Handover (State: COMPLETED)
    Platform->>Platform: 16. Vehicle returned to AVAILABLE; Mission sealed in Audit Log
```
