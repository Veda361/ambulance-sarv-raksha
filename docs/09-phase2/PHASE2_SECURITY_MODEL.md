# Phase 2 — Security Model & RBAC Matrix

**Document Reference**: `docs/09-phase2/PHASE2_SECURITY_MODEL.md`  
**Status**: `CONFIRMED`  

---

## 1. Zero-PHI Architectural Barrier

Patient Protected Health Information (PHI) is sensitive and subject to strict operational least-privilege principles:

| Role | Demographic PHI Access (`patient_name`, `age`) | Clinical Telemetry (`vitals`, `news2`) | Handover Notes | Justification |
|:---|:---:|:---:|:---:|:---|
| **SUPER_ADMIN** | ❌ FORBIDDEN | ❌ FORBIDDEN | ❌ FORBIDDEN | Technical system operators have zero legitimate clinical need for PHI. |
| **GOVERNMENT_OPERATOR** | ❌ FORBIDDEN | ❌ FORBIDDEN | ❌ FORBIDDEN | Regulatory command center views aggregate fleet metrics, not individual patient data. |
| **DRIVER** | ❌ FORBIDDEN | ❌ FORBIDDEN | ❌ FORBIDDEN | Drivers only require navigation coordinates, pickup address, and triage acuity code. |
| **EMT / NURSE** | ✅ READ/WRITE | ✅ READ/WRITE | ✅ READ/WRITE | Direct bedside care providers record vitals and condition changes. |
| **DISPATCHER** | ✅ READ | ⚠️ OPERATIONAL ONLY | ✅ READ | Requires chief complaint to dispatch appropriate ALS/BLS vehicle capability. |
| **HOSPITAL_ADMIN** | ✅ READ | ✅ READ | ✅ READ | Facility oversight and clinical governance. |
| **RECEIVING_STAFF** | ✅ READ | ✅ READ | ✅ READ/WRITE | Inbound preparation, trauma team briefing, and physical handover acceptance. |

---

## 2. Multi-Tenancy Enforcement

Every hospital organization is mathematically isolated:
1. **Tenant ID Scoping**: User authentication tokens contain `tenantId`. Services strictly bind queries with `tenant_id = $1`.
2. **Destination Envelope**: Missions destined for a hospital belonging to Tenant B are visible to Tenant B solely for pre-arrival coordination (`receiving_acknowledged_at`, handover).
3. **Cross-Tenant Prevention**: Hospital A users cannot modify, query, or observe Hospital B ambulances, internal missions, users, or audit logs.

---

## 3. Threat Model Evaluation (STRIDE)

| Threat Category | Potential Vector | Architectural Mitigation in Phase 2 | Residual Risk |
|:---|:---|:---|:---|
| **Spoofing** | Forged JWT access token | HMAC-SHA256 verification with 15m lifetime and cryptographically secure secret. | Token theft mitigated by short expiration. |
| **Tampering** | Mutation of audit logs | PostgreSQL `trg_audit_logs_immutable` trigger blocks UPDATE and DELETE; SHA-256 hash chains detect broken links. | Zero. Tamper-evident. |
| **Repudiation** | Denying assignment or handover action | Every privileged mutation stamps `actor_id`, `client_ip`, and writes an immutable audit record. | Zero. Complete attribution. |
| **Information Disclosure** | PHI leakage to drivers or regulators | Server-side redaction in `MissionService.getMissionById` and structural zero-PHI guards in `rbacGuard`. | Zero. Handled server-side. |
| **Denial of Service** | Duplicate rapid dispatch clicks | Concurrency row lock (`SELECT ... FOR UPDATE`) + `Idempotency-Key` deduplication. | Exactly one succeeds; subsequent return cached result. |
| **Elevation of Privilege** | Dispatcher attempting Super Admin operations | Strict `requirePermission(resource, action)` middleware verified against `PERMISSIONS` matrix before route handler execution. | Zero. |
