# Permission Matrix (RBAC & Tenant Enforcement)

**Status:** APPROVED FOR PHASE 0  
**Enforcement:** Evaluated at API Gateway and Service Middleware. Actions marked `DENY` return HTTP 403 Forbidden.  
**Legend:**  
- `ALL`: Full CRUD (Create, Read, Update, Delete) within tenant.  
- `READ`: Read-only access within tenant.  
- `SCOPED`: Read or Write restricted strictly to active assigned mission or facility.  
- `DENY`: Explicitly forbidden.

---

## 1. Resource Permission Mapping Table

| Platform Role | Organization | Hospital | Ambulance | Crew / Shift | Mission | Patient (PHI) | Vitals Telemetry | Alerts | Locations (GPS) | Reports / Analytics | Billing / Subscriptions | Devices (IoT) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Super Admin** | ALL | READ | READ | READ | READ (Metadata) | **DENY (Zero PHI)** | **DENY** | READ | READ | ALL (Platform) | ALL (Platform) | ALL |
| **Organization Admin** | READ (Own) | ALL (Own) | ALL (Own) | ALL (Own) | ALL (Own) | SCOPED (Own Org) | READ (Own) | ALL (Own) | READ (Own) | ALL (Own) | ALL (Own) | ALL (Own) |
| **Hospital Admin** | READ (Own) | ALL (Facility) | READ (Assigned) | READ (Facility)| ALL (Facility) | SCOPED (Facility)| READ (Facility)| ALL (Facility)| READ (Facility)| ALL (Facility) | READ (Facility) | READ (Facility)|
| **Dispatcher** | READ (Own) | READ (Own) | READ / UPDATE | ALL (Shift) | ALL (Own Org) | READ (Triage note) | READ (Alert status)| ALL (Dispatch)| READ (Fleet map)| READ (SLA ops) | **DENY** | READ |
| **Driver** | **DENY** | READ (Dest pin) | SCOPED (Vehicle)| READ (Own) | SCOPED (Active) | **DENY (Zero PHI)**| **DENY** | SCOPED (Transit)| WRITE (Stream) | **DENY** | **DENY** | READ (Paired) |
| **EMT / Paramedic** | **DENY** | READ (Dest cap) | READ (Assigned) | READ (Own) | SCOPED (Active) | ALL (Active Miss)| ALL (Active Miss)| ALL (Clinical) | READ (Active) | **DENY** | **DENY** | READ / WRITE |
| **Receiving Hospital**| **DENY** | READ (Facility) | READ (Inbound) | **DENY** | SCOPED (Inbound)| READ (Inbound) | READ (Inbound) | ALL (Pre-Arrival)| READ (Inbound)| READ (Handover) | **DENY** | **DENY** |
| **Government / EMS** | READ (Juris) | READ (Juris) | READ (Juris) | **DENY** | READ (Juris) | **DENY (Zero PHI)**| **DENY** | READ (Surge) | READ (Aggregated)| ALL (Jurisdiction)| **DENY** | **DENY** |

---

## 2. Granular Action Definitions by Resource

### 2.1 Mission Resource Actions
* `mission:create`: Permitted for Dispatcher, Hospital Admin, Organization Admin.
* `mission:assign`: Permitted for Dispatcher, Hospital Admin.
* `mission:accept`: Permitted strictly for the assigned Driver User.
* `mission:update_state`: Permitted for Driver (milestones), Dispatcher (re-route, cancel), Hospital Nurse (complete).
* `mission:cancel`: Permitted for Dispatcher, Supervisor with mandatory cancellation reason code.
* `mission:view_history`: Permitted within tenant scope for Admins, Dispatchers, and Handover participants.

### 2.2 Patient Health Information (PHI) Actions
* `patient:create`: Permitted for Dispatcher (intake note) and EMT (on-scene demographic update).
* `patient:read`: Permitted strictly for assigned EMT and Receiving Hospital triage clinicians.
* `patient:update_clinical`: Permitted strictly for assigned EMT.
* `patient:export_epcr`: Permitted for Receiving Hospital Medical Records and Organization Compliance Officer.
* **Universal Deny:** Driver, Super Admin, and Government Authorities have zero read/write access to patient names, national IDs, or sensitive medical history.

### 2.3 Handover Resource Actions
* `handover:initiate`: Permitted for EMT upon physical vehicle docking (`ARRIVED_HOSPITAL`).
* `handover:sign_hospital`: Permitted strictly for Receiving Hospital User (Triage Nurse / ER Physician).
* `handover:seal`: System execution upon receipt of dual sign-off; commits cryptographic hash to audit log.

---

## 3. Dynamic Policy Enforcement Middleware (Pseudocode Logic)

```typescript
function authorizeRequest(
  user: AuthenticatedUser,
  resource: ResourceType,
  action: ActionType,
  targetContext: TargetContext
): boolean {
  // 1. Super Admin Zero-PHI Boundary Check
  if (user.role === 'SUPER_ADMIN' && (resource === 'PATIENT' || resource === 'VITALS')) {
    throw new ForbiddenError('Super Admins are structurally denied access to clinical PHI');
  }

  // 2. Multi-Tenant Boundary Enforcement
  if (user.role !== 'SUPER_ADMIN' && user.tenantId !== targetContext.tenantId) {
    // Check if valid temporary Mission Coordination Envelope exists
    if (!isValidMissionCoordinationDelegate(user, targetContext.missionId)) {
      throw new ForbiddenError('Cross-tenant data access strictly prohibited');
    }
  }

  // 3. Role-Based Permission Evaluation
  const rolePermissions = PERMISSION_TABLE[user.role][resource];
  if (!rolePermissions || !rolePermissions.includes(action)) {
    throw new ForbiddenError(`Role ${user.role} lacks permission ${action} on ${resource}`);
  }

  // 4. Mission Ownership Check for Drivers and EMTs
  if ((user.role === 'DRIVER' || user.role === 'EMT') && user.activeMissionId !== targetContext.missionId) {
    throw new ForbiddenError('Field crew can only access their currently assigned mission');
  }

  return true;
}
```
