# ADR-P1-004: Authorization Implementation & Resource-Level RBAC

**Status:** APPROVED  
**Date:** 2026-09-06  
**Deciders:** Principal Software Architect, Security Architect, Domain Architect  
**Phase:** Phase 1 — Production Engineering Foundation

---

## 1. Context
Role-based access control must enforce least privilege across 8 roles defined in Phase 0:
`SUPER_ADMIN`, `ORGANIZATION_ADMIN`, `HOSPITAL_ADMIN`, `DISPATCHER`, `DRIVER`, `EMT`, `RECEIVING_HOSPITAL_USER`, `GOVERNMENT_OPERATOR`.

---

## 2. Problem
How should authorization be evaluated so that it is impossible for a client to bypass permissions, access another organization's resources, or allow a driver to view missions they do not operate?

---

## 3. Decision
**Implement a Two-Layer Server-Side Authorization Model:**

1. **Layer 1: Role & Action Gate (Middleware):**
   Evaluates whether the user's role possesses permission for the requested action on the target resource:
   $$\text{hasPermission}(user.role, resource, action)$$
   If false, immediately returns `403 Forbidden`.

2. **Layer 2: Resource Ownership & Context Scope Guard (Domain/Repository):**
   Even if a role has `mission:read`, the server verifies contextual ownership:
   - Organization Admins and Dispatchers may only access missions where `mission.tenant_id == user.tenant_id`.
   - Drivers and EMTs may only access the specific mission assigned to them (`mission.driver_id == user.id` or `mission.crew_id == user.id`).
   - Receiving Hospital Users may only view missions routed to their hospital (`mission.destination_hospital_id == user.hospital_id`).
   - Super Admins are strictly prohibited from viewing patient clinical PHI (`hasZeroPHIGuard()`).

---

## 4. Consequences
* **Consequences:** Eliminates Insecure Direct Object References (IDOR). Guarantees that frontend code is purely representational; the server is the sole arbiter of security.
