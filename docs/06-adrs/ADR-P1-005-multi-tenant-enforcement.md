# ADR-P1-005: Multi-Tenant Enforcement & Defense-in-Depth Isolation

**Status:** APPROVED  
**Date:** 2026-09-06  
**Deciders:** Principal Software Architect, Security Architect, Database Architect  
**Phase:** Phase 1 — Production Engineering Foundation

---

## 1. Context
Commercial competitors (rival hospital networks and independent ambulance fleets) share the platform infrastructure. A leak of vehicle positions, driver records, or patient data between tenants is a catastrophic business and legal failure.

---

## 2. Problem
How is multi-tenancy enforced with defense-in-depth so that a programming bug in an API controller cannot accidentally return cross-tenant records?

---

## 3. Decision
**Implement Defense-in-Depth Multi-Tenancy (Application Middleware + Scoped Repositories + Native PostgreSQL Row-Level Security).**

1. **Mandatory Tenant Discriminator:** Every tenant-scoped database table contains a non-nullable `tenant_id UUID REFERENCES organizations(id) ON DELETE RESTRICT`.
2. **Session Context Injection:** When a database client connection is checked out from the pool for an authenticated request, the middleware executes:
   ```sql
   SET LOCAL app.current_tenant_id = '<tenant-uuid>';
   ```
3. **PostgreSQL Row-Level Security (RLS):** Policies on all operational tables enforce:
   ```sql
   CREATE POLICY tenant_isolation_policy ON missions
     FOR ALL
     USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
   ```
4. **Scoped Repository Queries:** In addition to RLS, repository methods always append `WHERE tenant_id = $tenant_id` to prevent reliance on database defaults alone.

---

## 4. Consequences
* **Consequences:** Triple-layer protection: (1) API Auth Guard, (2) Scoped SQL query, (3) PostgreSQL kernel RLS. Even if an engineer mistakenly writes `SELECT * FROM missions WHERE id = $id`, PostgreSQL automatically filters out rows not belonging to the active tenant.
