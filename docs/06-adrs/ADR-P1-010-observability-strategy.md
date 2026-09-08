# ADR-P1-010: Observability, Structured Logging & Health Check Strategy

**Status:** APPROVED  
**Date:** 2026-09-06  
**Deciders:** Principal Software Architect, SRE / DevOps Architect, Security Architect  
**Phase:** Phase 1 — Production Engineering Foundation

---

## 1. Context
Diagnosing issues in production emergency coordination requires unambiguous telemetry. An error during ambulance dispatch or handover cannot be investigated using unstructured text console logs. Concurrently, logging must never leak Protected Health Information (PHI) or authentication secrets.

---

## 2. Problem
What observability standard should govern logs, metrics, correlation IDs, and health checks across the platform?

---

## 3. Decision
**Implement Structured JSON Logging (Pino) with PHI Redaction, Request Correlation IDs, and Tri-State Health Checks.**

1. **Structured JSON Logging:**
   - Powered by `pino` for low-overhead asynchronous logging.
   - Built-in redaction paths for sensitive keys: `password`, `token`, `authorization`, `patient_name`, `contact_phone`, `national_id`.
2. **Correlation & Request Tracking:**
   - Every incoming HTTP request and WebSocket handshake is assigned a unique `X-Request-ID` (UUIDv4) via middleware.
   - All log lines generated during request processing carry `requestId`, `tenantId`, and `userId`.
3. **Tri-State Health Endpoints:**
   - `/health`: Liveness probe. Returns HTTP 200 if the Node.js event loop is running.
   - `/ready`: Readiness probe. Executes a fast `SELECT 1` on the PostgreSQL database pool. Returns HTTP 200 if ready to serve traffic; HTTP 503 if database connection is failing.
   - `/metrics`: System metrics snapshot (memory heap, active WebSocket connection count, database pool stats).

---

## 4. Consequences
* **Consequences:** Observability answers: *What happened? When? To which mission? For which tenant? Which request produced it? Did it succeed or fail?* All with zero PHI leakage.
