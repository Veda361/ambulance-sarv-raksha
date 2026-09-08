# ADR-P1-002: Persistence Strategy & Relational Architecture

**Status:** APPROVED  
**Date:** 2026-09-06  
**Deciders:** Principal Software Architect, Data Architect, Database Administrator  
**Phase:** Phase 1 — Production Engineering Foundation

---

## 1. Context
The Ambulance Coordination Platform requires transactional consistency for dispatch and state transitions, strict multi-tenant data segregation, geospatial proximity calculations for dispatching, and high-frequency time-series storage for GPS and physiological telemetry.

---

## 2. Problem
Which database engine and persistence access pattern should be implemented in Phase 1:
1. ORM-heavy abstraction (e.g. Prisma / TypeORM)?
2. Raw connection pooling with SQL migrations and repository pattern using native `pg`?
3. Document / NoSQL database (e.g. MongoDB)?

---

## 3. Evaluated Options
* **Option A: Heavy ORM (Prisma / TypeORM):** Abstracted models, schema auto-generation. However, Prisma has historically struggled with fine-grained PostgreSQL session variables (`SET LOCAL app.current_tenant_id`) across connection pool transactions, risking multi-tenant RLS bypass.
* **Option B: Explicit SQL Migrations & Repository Pattern via Native `pg` (Recommended):** Handcrafted, deterministic, versioned SQL migrations. Explicit transaction wrappers that run `SET LOCAL app.current_tenant_id = $1` on every transactional client check-out. Repositories encapsulate SQL queries and map to strongly typed domain entities.
* **Option C: Document Store (MongoDB):** Lacks ACID transactions across multiple collections; poor spatial query optimizations compared to PostgreSQL PostGIS/Cube.

---

## 4. Decision
**Adopt Option B: Native PostgreSQL 16 with Deterministic SQL Migrations and Typed Repository Pattern.**

* **Driver:** `pg` (node-postgres) with strict connection pooling.
* **Spatial Calculations:** Leverages PostgreSQL's native `cube` and `earthdistance` extensions for spherical Haversine distance ranking (`earth_distance(ll_to_earth(lat1, lon1), ll_to_earth(lat2, lon2))`), ensuring immediate local development compatibility and sub-millisecond proximity queries.
* **Multi-Tenancy:** PostgreSQL Row-Level Security (RLS) is applied to all tenant-scoped tables (`hospitals`, `ambulances`, `crew`, `missions`, `patients`, `locations`, `vitals`, `alerts`).
* **Migrations:** Strictly versioned, sequential SQL files (`001_initial_schema.sql`, `002_...sql`) executed through a dedicated migration runner with a tracking table (`schema_migrations`).

---

## 5. Consequences & Revisit Conditions
* **Consequences:** Maximum transparency, zero ORM query generation anomalies, deterministic transaction boundaries, complete control over index strategy.
* **Revisit Conditions:** If active telematics volume exceeds 5,000 writes/sec, introduce dedicated TimescaleDB hypertable compression or an independent ingestion pipeline.
