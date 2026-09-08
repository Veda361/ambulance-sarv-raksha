# Testing Strategy & Automated Test Verification

**Document ID:** `docs/07-phase1/testing-strategy.md`  
**Status:** COMPLETED / 100% AUTOMATED TEST SUITE PASSING  
**Test Framework:** Vitest 3.x + Supertest  
**Target Test Database:** PostgreSQL `sarvraksha_test`

---

## 1. Multi-Tier Testing Pyramid

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           AUTOMATED TEST PYRAMID                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 1. SECURITY & TENANT ISOLATION TESTS (Integration)                              │
│ • Cross-tenant mission access rejection (Assert 403 / 404)                      │
│ • Driver-to-driver mission transition isolation                                 │
│ • Zero-PHI data masking for non-clinical roles                                  │
│ • Audit log immutability trigger enforcement                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 2. END-TO-END GOLDEN PATH TESTS (Integration)                                   │
│ • Complete mission lifecycle (REQUESTED -> ASSIGNED -> ... -> COMPLETED)        │
│ • Geospatial Haversine vehicle recommendation ranking                           │
│ • Telemetry deduplication on sequenceNumber                                     │
│ • NEWS2 acute hypoxia clinical alert generation                                 │
│ • Cryptographic SHA-256 audit chain integrity verification                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 3. DOMAIN & RULES UNIT TESTS (Fast / In-Memory)                                 │
│ • Finite State Machine valid progression & illegal transition rejection         │
│ • NEWS2 mathematical score calculation & critical red flags                    │
│ • RBAC least-privilege matrix evaluation across 8 roles                         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Test Execution Commands

```bash
# Run complete test suite once
cd backend && npm test

# Run tests in watch mode during development
cd backend && npm run test:watch

# Run test coverage audit
cd backend && npm run test:coverage
```

---

## 3. Test Suite Results (Phase 1 Baseline Audit)

```
 RUN  v3.2.7 /home/dev/Desktop/jahnsi-ambulance-project/backend

 ✓ tests/unit/news2.test.ts (3 tests) 22ms
 ✓ tests/unit/missionFSM.test.ts (6 tests) 20ms
 ✓ tests/unit/rbac.test.ts (4 tests) 38ms
 ✓ tests/integration/endToEndFoundation.test.ts (18 tests) 7334ms

 Test Files  4 passed (4)
      Tests  31 passed (31)
   Duration  9.68s
```

* **Pass Rate:** 31 / 31 tests passed (100%).
* **Zero Mocks on Persistence:** Integration tests execute against genuine PostgreSQL tables, testing actual SQL queries, spatial distance calculations, triggers, and Row-Level Security rules.
