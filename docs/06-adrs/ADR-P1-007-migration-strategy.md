# ADR-P1-007: Database Migration & Schema Evolution Strategy

**Status:** APPROVED  
**Date:** 2026-09-06  
**Deciders:** Principal Software Architect, Database Architect, DevOps Architect  
**Phase:** Phase 1 — Production Engineering Foundation

---

## 1. Context
A production healthcare platform cannot rely on runtime auto-syncing (e.g. `sequelize.sync({ force: true })` or uncontrolled ORM migrations) because of the risk of data loss, locking contention, and lack of reproducibility across staging and production environments.

---

## 2. Problem
What strategy guarantees repeatable, auditable, and forward-compatible database schema migrations?

---

## 3. Decision
**Adopt Forward-Only, Versioned SQL Migrations Managed by a Dedicated Migration Runner.**

1. **Sequential Migration Files:** Migrations reside in `backend/src/database/migrations/` named with zero-padded sequential numbers and descriptive titles (e.g. `001_initial_schema.sql`, `002_add_indexes.sql`).
2. **Migration Tracking Table:** A system table `schema_migrations` records `(version, name, executed_at, checksum)`.
3. **Atomic Execution:** Each migration runs inside an explicit database transaction (`BEGIN ... COMMIT`). If any statement fails, the entire migration rolls back immediately.
4. **Idempotent CLI Runner:** `npm run migrate` inspects executed migrations, applies pending files in strict numerical order, and fails fast if checksum mismatches are detected.

---

## 4. Consequences
* **Consequences:** 100% auditable schema changes in Git. Safe CI/CD deployments where database changes precede container cutovers.
