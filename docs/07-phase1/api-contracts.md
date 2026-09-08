# API Contracts & Endpoint Specifications (v1)

**Document ID:** `docs/07-phase1/api-contracts.md`  
**Status:** COMPLETED / VERIFIED  
**Base URL:** `/api/v1`

---

## 1. Protocol Conventions & Standards

* **Content-Type:** `application/json` for all request bodies and responses.
* **Authentication:** `Authorization: Bearer <jwt_access_token>` header on all protected endpoints.
* **Correlation Tracking:** `X-Request-ID` header returned on every response for distributed tracing and error triage.
* **Standard Success Envelope:**
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": {
      "requestId": "550e8400-e29b-41d4-a716-446655440000",
      "timestamp": "2026-09-06T17:00:00.000Z"
    }
  }
  ```
* **Standard Error Envelope:**
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR | AUTHENTICATION_REQUIRED | FORBIDDEN_RESOURCE_ACCESS | RESOURCE_NOT_FOUND | INVALID_STATE_TRANSITION | INTERNAL_SERVER_ERROR",
      "message": "Human-readable description of error",
      "details": [ ... ]
    },
    "meta": {
      "requestId": "550e8400-e29b-41d4-a716-446655440000",
      "timestamp": "2026-09-06T17:00:00.000Z"
    }
  }
  ```

---

## 2. Core Endpoint Group Specifications

### 2.1 Authentication (`/api/v1/auth`)
* `POST /api/v1/auth/login`: Authenticate with email & password. Returns short-lived `accessToken` (15m), `refreshToken` (7d), and user profile.
* `POST /api/v1/auth/register`: Admin registration of platform users with role assignment.
* `POST /api/v1/auth/refresh`: Rotate refresh token and obtain new JWT access token.
* `POST /api/v1/auth/logout`: Revoke refresh token family in database.
* `GET /api/v1/auth/me`: Retrieve current authenticated user session context.

### 2.2 Organizations & Hospitals (`/api/v1/organizations`)
* `POST /api/v1/organizations`: Create new customer tenant (`PRIVATE_HOSPITAL`, `AMBULANCE_OPERATOR`, etc.).
* `GET /api/v1/organizations`: List active organizations.
* `GET /api/v1/organizations/:id`: Retrieve single organization.
* `POST /api/v1/organizations/:id/hospitals`: Provision hospital facility with trauma level and coordinates.
* `GET /api/v1/organizations/:id/hospitals`: List hospitals under tenant.

### 2.3 Fleet & Telematics (`/api/v1/fleet`)
* `POST /api/v1/fleet/ambulances`: Register ambulance with call sign and capability (`BLS`, `ALS`, `NICU`, `PTV`).
* `GET /api/v1/fleet/ambulances`: List fleet ambulances for active tenant.
* `GET /api/v1/fleet/ambulances/nearest?lat=...&lon=...&capability=...`: Geospatial nearest-neighbor search ranking available ambulances by distance in meters.
* `PATCH /api/v1/fleet/ambulances/:id/status`: Update vehicle operational status (`AVAILABLE`, `MAINTENANCE`, `OFF_DUTY`).
* `POST /api/v1/fleet/crew-shifts`: Pair Driver and optional EMT to ambulance for active shift.

### 2.4 Mission Lifecycle & Clinical Workflows (`/api/v1/missions`)
* `POST /api/v1/missions/patient`: Create patient clinical demographic record.
* `POST /api/v1/missions`: Create emergency mission, allocate vehicle, and transition state to `ASSIGNED`.
* `GET /api/v1/missions`: Paginated list of active tenant missions (`limit`, `offset`).
* `GET /api/v1/missions/:id`: Retrieve mission details, linked ambulance call sign, destination hospital, and patient data (Zero-PHI redaction applied for drivers).
* `POST /api/v1/missions/:id/transition`: Execute finite state machine transition (`targetState: ACCEPTED | EN_ROUTE_TO_PICKUP | ARRIVED_PICKUP | PATIENT_ONBOARD | EN_ROUTE_TO_HOSPITAL | ARRIVED_HOSPITAL | HANDOVER | COMPLETED | CANCELLED | REJECTED`).
* `POST /api/v1/missions/:id/location`: Stream GPS coordinates (`lat`, `lon`, `speedMps`, `sequenceNumber`, `recordedAt`). Automatically deduplicates packets on `sequenceNumber` and recalculates dynamic arrival ETA.
* `POST /api/v1/missions/:id/vitals`: Ingest physiological telemetry (`heartRate`, `spo2Percent`, `systolicBp`, `respiratoryRate`). Automatically computes NEWS2 score and triggers critical alert if score $\ge 7$ or red flags exist.

### 2.5 IoT Device Gateway (`/api/v1/devices`)
* `POST /api/v1/devices`: Register in-vehicle hardware gateway (`OBD2_TRACKER`, `ESP32_GATEWAY`, `STM32_MONITOR_BRIDGE`). Returns raw API key.
* `POST /api/v1/devices/telemetry`: Direct edge hardware ingestion authenticated via API Key hash, updating paired ambulance telemetry.
