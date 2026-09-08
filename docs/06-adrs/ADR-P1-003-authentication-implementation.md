# ADR-P1-003: Authentication Implementation & Credential Security

**Status:** APPROVED  
**Date:** 2026-09-06  
**Deciders:** Principal Software Architect, Security Architect, Senior Backend Architect  
**Phase:** Phase 1 — Production Engineering Foundation

---

## 1. Context
Authentication must secure API access across web portals (Dispatch, Hospital Triage, Organization Admin) and mobile devices (Ambulance Drivers, EMTs). Credentials must be protected against brute-force, theft, and offline hash extraction.

---

## 2. Problem
Which token and credential management model should be implemented in Phase 1?

---

## 3. Decision
**Adopt Dual-Token JWT Model (Short-Lived Access + Revocable Refresh Tokens) with Bcrypt Password Hashing.**

1. **Password Security:** Passwords hashed with `bcryptjs` using a salt factor of 12. Plaintext passwords are never logged, serialized, or stored.
2. **Access Tokens:** Signed JSON Web Tokens (JWT) with a short 15-minute expiration time (`exp: 900s`). Carries claims: `sub` (user_id), `tenant_id`, `role`, `org_type`.
3. **Refresh Tokens:** Cryptographically random 256-bit hexadecimal strings stored in database table `user_refresh_tokens` with expiration (7 days), user agent, and revocation flags.
4. **Token Revocation:** User logout, role change, or security incident immediately revokes the refresh token family in the database.
5. **Device Binding Foundation:** Mobile logins include a `device_id` claim in the session to facilitate instant single-device revocation during device loss.

---

## 4. Consequences & Security Impact
* **Consequences:** Short-lived tokens minimize exposure if a mobile device network traffic is intercepted. Revocation gives administrators instant control to terminate compromised driver or dispatcher sessions.
* **Revisit Conditions:** When enterprise SAML 2.0 / OIDC federation is required for hospital networks in Phase 2.
