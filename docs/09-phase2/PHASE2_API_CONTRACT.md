# Phase 2 — Hospital Operations API Contract

**Document Reference**: `docs/09-phase2/PHASE2_API_CONTRACT.md`  
**Base Path**: `/api/v1`  
**Authentication**: Bearer JWT (`Authorization: Bearer <token>`)  
**Idempotency**: Supported on all mutations via `Idempotency-Key: <UUID>` header  

---

## 1. Authentication Endpoints

### POST `/api/v1/auth/login`
- **Description**: Authenticates operational user and generates 15-minute access token and 7-day refresh token.
- **Request Body**:
  ```json
  {
    "email": "admin@apex.org",
    "password": "HospitalSecure123!"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbG...",
      "refreshToken": "4a7f...",
      "expiresIn": 900,
      "user": {
        "id": "uuid",
        "tenantId": "uuid",
        "name": "Dr. Sarah Jenkins",
        "email": "admin@apex.org",
        "role": "HOSPITAL_ADMIN"
      }
    }
  }
  ```

---

## 2. Hospital Operations & Dashboard Endpoints

### GET `/api/v1/hospital-ops/dashboard`
- **Description**: Returns real-time KPI metrics, active dispatches, and fleet status for the hospital.
- **Query Parameters**: `hospitalId` (optional UUID)
- **Response**: `200 OK`

### GET `/api/v1/hospital-ops/hospitals/:id`
- **Description**: Fetches facility profile and diversion status.
- **Response**: `200 OK`

### PATCH `/api/v1/hospital-ops/hospitals/:id/status`
- **Description**: Updates facility emergency diversion status.
- **Permission**: `hospital:update`
- **Request Body**:
  ```json
  { "diversionStatus": "ADVISORY" }
  ```
- **Allowed Values**: `NORMAL`, `ADVISORY`, `DIVERT_ALL`, `TRAUMA_BYPASS`

---

## 3. Fleet Management Endpoints

### GET `/api/v1/fleet/ambulances`
- **Description**: Lists hospital ambulances with capability, current status, and coordinates.

### POST `/api/v1/fleet/ambulances`
- **Description**: Registers a new ambulance into the hospital fleet.
- **Permission**: `ambulance:create`

### GET `/api/v1/fleet/ambulances/nearest`
- **Description**: Returns nearest available ambulances sorted by Haversine distance.
- **Query Parameters**: `lat`, `lon`, `capability` (optional)

### PATCH `/api/v1/fleet/ambulances/:id/status`
- **Description**: Updates ambulance status (e.g. `AVAILABLE`, `MAINTENANCE`).
- **Permission**: `ambulance:update`

---

## 4. Mission Dispatch Endpoints

### POST `/api/v1/missions`
- **Description**: Concurrency-safe ambulance mission creation with pessimistic row lock on vehicle.
- **Permission**: `mission:create`

### GET `/api/v1/missions`
- **Description**: Lists missions with cross-tenant inbound envelope support.
- **Query Parameters**: `state`, `triageAcuity`, `limit`, `offset`

### POST `/api/v1/missions/:id/transition`
- **Description**: Advances mission state according to deterministic 13-state FSM.
- **Permission**: `mission:transition`

---

## 5. Receiving Hospital Coordination Endpoints

### GET `/api/v1/receiving/inbound`
- **Description**: Inbound emergency ambulances approaching facility with dynamic ETAs and latest NEWS2 vitals.
- **Permission**: `receiving:read`

### POST `/api/v1/receiving/:id/acknowledge`
- **Description**: Receiving hospital staff acknowledges incoming ambulance.
- **Permission**: `receiving:manage`

### POST `/api/v1/receiving/:id/prepare`
- **Description**: Marks resuscitation/trauma bay prepared.
- **Permission**: `receiving:manage`

### POST `/api/v1/receiving/:id/handover`
- **Description**: Completes physical clinical handover and finalizes mission.
- **Permission**: `receiving:manage`
- **Request Body**:
  ```json
  { "handoverNotes": "Patient received in Trauma Bay 1. Handover signed by Dr. Mehta." }
  ```

---

## 6. Operational Alert Endpoints

### GET `/api/v1/alerts`
- **Description**: Paginated alert records filtered by severity and acknowledgment state.

### POST `/api/v1/alerts/:id/acknowledge`
- **Description**: Acknowledges actionable alert with user attribution.
- **Permission**: `alert:acknowledge`

---

## 7. Audit & Verification Endpoints

### GET `/api/v1/audit-logs`
- **Description**: Paginated WORM audit records for tenant.
- **Permission**: `audit:read`

### GET `/api/v1/audit-logs/verify-integrity`
- **Description**: Traverses the SHA-256 cryptographic blockchain hash chain and validates zero tampering.
- **Permission**: `audit:read`
