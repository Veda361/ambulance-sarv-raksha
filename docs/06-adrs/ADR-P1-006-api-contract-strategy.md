# ADR-P1-006: API Contract Strategy, Versioning & DTO Separation

**Status:** APPROVED  
**Date:** 2026-09-06  
**Deciders:** Principal Software Architect, API Architect, Senior Backend Architect  
**Phase:** Phase 1 — Production Engineering Foundation

---

## 1. Context
Future web portals and native Android mobile clients will consume the backend API. Android mobile apps in the field cannot be updated instantaneously, meaning the backend must preserve backward compatibility without breaking existing deployed client versions.

---

## 2. Problem
How should API contracts be versioned, structured, and decoupled from internal persistence models?

---

## 3. Decision
**Adopt URI-Path Versioning (`/api/v1/...`) with Strict Request/Response DTO Separation.**

1. **Version Namespace:** All Phase 1 endpoints reside under `/api/v1/`. Breaking changes in the future will be isolated under `/api/v2/`.
2. **DTO Layer:** Database models are never directly returned to API clients. Dedicated Data Transfer Objects (DTOs) and serializers transform internal entities into public contracts, explicitly pruning internal database columns, password hashes, and sensitive audit metadata.
3. **Consistent Response Envelope:**
   ```json
   {
     "success": true,
     "data": { ... },
     "meta": {
       "request_id": "req-98f23...",
       "timestamp": "2026-09-06T15:30:00.000Z",
       "pagination": { "page": 1, "limit": 20, "total": 45 }
     }
   }
   ```
4. **Standardized Error Envelope:**
   ```json
   {
     "success": false,
     "error": {
       "code": "INVALID_STATE_TRANSITION",
       "message": "Cannot transition mission from EN_ROUTE_TO_HOSPITAL to EN_ROUTE_TO_PICKUP",
       "details": [ ... ]
     },
     "meta": { "request_id": "req-...", "timestamp": "..." }
   }
   ```
5. **Request Validation:** Zod schemas validate 100% of request bodies, query params, and route parameters before execution reaches domain services.

---

## 4. Consequences
* **Consequences:** Clean separation of concerns. Database column renames do not break mobile clients. Predictable client parsing across Android Kotlin and React TypeScript.
