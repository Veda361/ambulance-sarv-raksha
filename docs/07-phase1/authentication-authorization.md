# Authentication & Authorization Implementation

**Document ID:** `docs/07-phase1/authentication-authorization.md`  
**Status:** COMPLETED / VERIFIED BY TEST SUITE

---

## 1. Authentication Architecture

The platform implements a **Dual-Token Model** balancing security, performance, and instant session revocability:

```
[ Client Login (Email + Password) ]
               │
               ▼
[ Server: Verifies Bcrypt Hash (Salt 12) ]
               │
               ├──► [ Generates Short-Lived Access Token ]
               │    • Format: Signed JWT (HS256 in Dev, RS256 ready)
               │    • Claims: sub, tenantId, role, email, name
               │    • Expiration: 15 minutes (900 seconds)
               │
               └──► [ Generates Cryptographic Refresh Token ]
                    • Format: Random 256-bit Hexadecimal string
                    • Storage: SHA-256 hash in `user_refresh_tokens` table
                    • Expiration: 7 days
                    • Revocation: Immediate upon logout or security flag
```

* **Zero Plaintext Secrets:** Passwords hashed with `bcryptjs` using a cost factor of 12.
* **Token Invalidation:** Calling `POST /api/v1/auth/logout` flags the token record in PostgreSQL as `is_revoked = true`, instantly preventing further access token refresh.

---

## 2. Server-Side RBAC & Permission Enforcement

All permissions are evaluated strictly on the backend via `requirePermission(resource, action)` middleware:

```
HTTP Request ──► authGuard (Validates JWT, extracts req.user & req.tenantId)
                     │
                     ▼
             requirePermission(resource, action)
                     │
                     ├── [1. Zero-PHI Guard]
                     │   If User is SUPER_ADMIN and Resource is 'patient'/'vital'
                     │   ──► RETURN 403 FORBIDDEN
                     │
                     ├── [2. RBAC Matrix Check]
                     │   Evaluates PERMISSIONS[role][resource].includes(action)
                     │   If False ──► RETURN 403 FORBIDDEN
                     │
                     └── [3. Domain Context Guard]
                         Matches req.tenantId with target entity ownership
                         If Cross-Tenant and no coordination envelope exists
                         ──► RETURN 404 / 403
```

---

## 3. Role Entitlements & Guardrails

| Role | Organization Scope | Patient PHI Access | Telemetry Writing | Dispatch & FSM Authority |
| :--- | :--- | :---: | :---: | :--- |
| `SUPER_ADMIN` | Global Metadata | **STRICTLY DENIED** | Read Only | Administrative Override |
| `ORGANIZATION_ADMIN` | Scoped to Tenant | Read / Update | Read Only | Full Fleet & Mission Control |
| `HOSPITAL_ADMIN` | Scoped to Facility | Read / Update | Read Only | Create Missions, Set Diversion |
| `DISPATCHER` | Scoped to Tenant | Read (Triage Note) | Read Only | Create & Assign Missions |
| `DRIVER` | Scoped to Active Vehicle | **STRICTLY DENIED** | Write GPS | Accept, Navigate, Milestones |
| `EMT` | Scoped to Active Mission | Full Clinical | Write Vitals | Patient Intake & Vitals Stream |
| `RECEIVING_HOSPITAL_USER` | Scoped to Inbound Units | Read Inbound Only | Read Only | Verify Handover & Sign-Off |
| `GOVERNMENT_OPERATOR` | Jurisdiction View | **STRICTLY DENIED** | Read Only | SLA Auditing & Heatmaps |
