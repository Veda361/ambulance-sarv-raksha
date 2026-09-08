# ADR-002: Multi-Tenant Architecture & Data Partitioning Model

**Status:** APPROVED  
**Date:** 2026-09-06  
**Deciders:** Principal Solution Architect, Security Architect, Database Architect  
**Consulted:** DevOps Lead, Healthcare Compliance Advisor

---

## 1. Context
The platform serves five diverse customer categories: Private Hospitals, Hospital Networks, Commercial Ambulance Operators, Government/EMS Authorities, and Independent Fleets. Commercial competitors (e.g., rival hospital chains and independent ambulance fleets) must operate on the platform with absolute guarantees that their proprietary operational data and confidential patient health information (PHI) cannot be accessed, leaked, or scraped by another tenant. At the same time, the system must facilitate transient cross-tenant emergency handovers.

---

## 2. Problem
Which multi-tenancy partitioning model best balances data security, medicolegal isolation, cross-tenant coordination, operational cost, and database maintenance overhead:
1. Database-per-Tenant (Isolated Physical Silo)?
2. Schema-per-Tenant (Shared Cluster, Separate PostgreSQL Schemas)?
3. Shared-Database with Discriminator Column & Row-Level Security (RLS) (Pooled)?

---

## 3. Evaluated Options

### Option A: Database-per-Tenant (Physical Silo)
* *Description:* Every customer organization gets an isolated PostgreSQL database instance.
* *Pros:* Maximum theoretical isolation; effortless per-tenant backup and restore; easy compliance audit for sovereign accounts.
* *Cons:* Extreme infrastructure cost for small fleets; high operational complexity (running migrations across hundreds of databases); cross-tenant mission coordination (ambulance from Operator A handing over to Hospital B) requires distributed database cross-queries or complex ETL replication.

### Option B: Schema-per-Tenant (Separate PostgreSQL Schemas)
* *Description:* Single database instance, but each tenant has a dedicated PostgreSQL schema (`tenant_alpha.missions`, `tenant_beta.missions`).
* *Pros:* Logical isolation within a single database connection pool.
* *Cons:* Connection pooling challenges (PgBouncer search path issues); schema migration drift; database catalog performance degradation beyond 1,000 schemas.

### Option C: Pooled Shared-Database with Native Row-Level Security (RLS) (Recommended)
* *Description:* All tenants share database tables. Every table includes a mandatory `tenant_id UUID` column. PostgreSQL Row-Level Security (RLS) policies enforce that queries automatically filter by the session's active `tenant_id`. Scoped cross-tenant coordination is executed via explicit cryptographic mission delegation views.
* *Pros:* Optimal resource utilization and low infrastructure cost; single migration execution; highly performant connection pooling; native PostgreSQL kernel enforcement of tenant isolation; seamless cross-tenant mission sharing via scoped database policies.
* *Cons:* Requires rigorous enforcement of `SET LOCAL app.current_tenant_id` in application connection middleware; risk of data leak if a developer explicitly bypasses RLS in superuser mode.

---

## 4. Decision
**Adopt Option C (Pooled Database with PostgreSQL Row-Level Security)** as the default architecture for all standard SaaS tiers (Basic, Professional, Enterprise).

**Architecture Caveat:** For sovereign Government / EMS Authority deployments or enterprise health systems with strict statutory on-premises data localization mandates, provide an **Isolated Dedicated Silo Deployment (Option A)** packaged via Terraform/Helm charts.

---

## 5. Rationale
* **Cross-Tenant Emergency Coordination:** In emergency response, vehicles from a commercial operator regularly transport patients to private hospitals or municipal trauma centers. In a pooled model, creating a temporary **Mission Coordination Envelope** (granting the receiving hospital read access to the specific incoming mission) is a clean, sub-millisecond relational transaction. In a database-per-tenant model, this requires building complex distributed event synchronization layers.
* **Cost & Scale Efficiency:** Managing thousands of independent databases for 2-vehicle independent fleets is financially unviable and operationally brittle.

---

## 6. Consequences
* **Positive:**
  - Cost-efficient SaaS scaling across hundreds of small operators.
  - Zero cross-tenant data leaks due to database-level policy enforcement.
  - Simplified reporting and analytics aggregation.
* **Negative:**
  - Application middleware must rigorously wrap every database transaction with tenant context initialization.
  - Superuser database connections must be forbidden in application runtime containers to prevent accidental policy bypass.

---

## 7. Revisit Conditions
This decision will be revisited if a major enterprise hospital network legally mandates physical database isolation as an absolute condition of contract signature, triggering the deployment of the Option A dedicated silo package.
