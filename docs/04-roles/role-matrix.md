# Role Matrix: Ambulance Coordination Platform

**Status:** APPROVED FOR PHASE 0  
**Scope:** Defines the complete hierarchy, organizational scoping, and operational boundaries of all platform user roles.

---

## 1. Role Hierarchy & Organizational Scoping

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PLATFORM SUPER ADMIN                             │
│       (Global Infrastructure, Tenant Provisioning, System Auditing)         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│  ORGANIZATION    │          │  ORGANIZATION    │          │  GOVERNMENT /    │
│  ADMIN (HOSPITAL)│          │  ADMIN (OPERATOR)│          │  EMS SUPERVISOR  │
└────────┬─────────┘          └────────┬─────────┘          └────────┬─────────┘
         │                             │                             │
    ┌────┴────┐                   ┌────┴────┐                        │
    ▼         ▼                   ▼         ▼                        ▼
┌────────┐┌────────┐         ┌────────┐┌────────┐              ┌───────────────┐
│HOSPITAL││RECEIV- │         │COMMER- ││DRIVER  │              │MUNICIPAL CAD  │
│ADMIN   ││ING ER  │         │CIAL    ││/ EMT   │              │WATCHSTANDER   │
│        ││USER    │         │DISPATCH││        │              │               │
└────────┘└────────┘         └────────┘└────────┘              └───────────────┘
```

---

## 2. Detailed Role Definitions

### 1. Platform Super Admin
* **Organizational Boundary:** Global (Platform-wide across all tenants).
* **Primary Scope:** Infrastructure operations, tenant provisioning, subscription tier assignment, and global platform observability.
* **Security Guardrail:** Strictly restricted from viewing decrypted Patient Health Information (PHI) or accessing hospital clinical records to maintain zero-trust tenant confidentiality.

### 2. Organization Admin
* **Organizational Boundary:** Scoped strictly to their assigned `tenant_id`.
* **Primary Scope:** Creating and managing ambulances, user accounts, shift rosters, IoT devices, and reviewing organization-level SLA compliance and billing.
* **Security Guardrail:** Cannot read or write data belonging to other organizations.

### 3. Hospital Admin
* **Organizational Boundary:** Scoped to a specific `hospital_id` within an Organization.
* **Primary Scope:** Managing emergency department capabilities, trauma bay configurations, hospital diversion statuses, and reviewing inbound transfer statistics.
* **Security Guardrail:** Scoped strictly to facility operations.

### 4. Emergency Dispatcher
* **Organizational Boundary:** Scoped to `tenant_id` (or regional dispatch sector).
* **Primary Scope:** Ingesting emergency requests, creating missions, matching and dispatching ambulances, monitoring active vehicle movements, and handling timeouts.
* **Security Guardrail:** Can view pickup locations and caller notes; cannot modify clinical medical interventions or delete missions.

### 5. Ambulance Driver
* **Organizational Boundary:** Scoped strictly to their currently assigned vehicle and active `mission_id`.
* **Primary Scope:** Acknowledging dispatch alerts, executing operational milestone state transitions (`ACCEPTED`, `EN_ROUTE_PICKUP`, `ARRIVED_PICKUP`, `EN_ROUTE_HOSPITAL`, `ARRIVED_HOSPITAL`), and streaming background GPS.
* **Security Guardrail:** Cannot view patient medical history, hospital internal bed status, or unassigned fleet vehicles.

### 6. EMT / Paramedic / Flight Nurse
* **Organizational Boundary:** Scoped strictly to their active `mission_id` and assigned patient.
* **Primary Scope:** Recording patient initial triage, attaching physiological monitors, logging clinical interventions en route, reviewing automated early warning scores, and executing clinical handover.
* **Security Guardrail:** Access to patient PHI terminates upon completed handover.

### 7. Receiving Hospital User (Triage Nurse / Trauma Team)
* **Organizational Boundary:** Scoped to inbound and active missions routed to their specific `hospital_id`.
* **Primary Scope:** Monitoring the live inbound ambulance radar, reviewing pre-arrival patient vitals and deterioration flags, preparing trauma bays, and executing clinical handover sign-off.
* **Security Guardrail:** Read-only access to vehicle GPS and incoming vitals; cannot modify dispatch assignments or view unrelated ambulance fleet records.

### 8. Government / EMS Operator (Public Safety Monitor)
* **Organizational Boundary:** Scoped to a defined geographic jurisdiction across participating licensed operators.
* **Primary Scope:** Monitoring aggregate fleet distribution heatmaps, auditing regional response time SLAs, and coordinating multi-agency mutual aid during municipal disasters.
* **Security Guardrail:** **Strictly prohibited from viewing individual patient identifiable records (PHI)**; views only anonymized, aggregated operational telemetry.
