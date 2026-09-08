# Platform Development & Phasing Plan

**Status:** RECONCILED WITH PHASE 0 CHARTER  
**Canonical Specifications:**
- [Product Scope Specification](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/00-product/product-scope.md)
- [MVP Definition (The Golden Path)](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/00-product/mvp-definition.md)
- [Production Scope](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/00-product/production-scope.md)
- [Phase 0 Quality Gate Report](file:///home/dev/Desktop/jahnsi-ambulance-project/docs/phase-0-quality-gate-report.md)

---

## 1. Phasing Roadmap Overview

```
Phase 0 (CURRENT)          Phase 1 (MVP)              Phase 2 (Production)       Phase 3 (Future)
Architecture Freeze        Core Closed-Loop Proof     Enterprise Hardening       Ecosystem Scale
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│ • Product Charter   │    │ • Backend Monolith  │    │ • Postgres RLS      │    │ • Waveform Streaming│
│ • Domain & FSM      │───►│ • Native Android App│───►│ • Physical IoT HAL  │───►│ • Regional CAD Bridge│
│ • Security & Threat │    │ • Hospital Web SPA  │    │ • Tamper-Evident    │    │ • Dynamic AI Demand │
│ • 8 ADRs Approved   │    │ • Vitals Simulator  │    │ • SAML SSO & MFA    │    │ • MCI Auto-Triage   │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

---

## 2. Phase Breakdown

### Phase 0: Product & Architectural Freeze (COMPLETED)
- Definition of functional requirements (FR-001 to FR-019) and non-functional requirements (NFR-001 to NFR-013).
- Bounding of MVP Golden Path vs. Production Scope and explicit Non-Goals.
- Architectural Decision Records (ADR-001 through ADR-008) approved.
- Quality Gate Audit passed with 26/26 verification criteria satisfied.

### Phase 1: MVP Engineering Implementation (NEXT PHASE)
- **Backend Modular Monolith:** In-process domain event bus, PostgreSQL with PostGIS, Redis Pub/Sub, Mission FSM.
- **Android Driver App:** Background location service, offline SQLite Room store-and-forward queue, single-tap UI.
- **Hospital Triage Web App:** React/Vite single-page application with live map radar and dynamic ETA countdowns.
- **Simulated Vitals Engine:** Software-driven telemetry generator streaming realistic acute clinical deterioration profiles.
- **Validation Milestone:** End-to-end mission demonstration across physical devices.

### Phase 2: Production Hardening & Enterprise Scale
- Native PostgreSQL Row-Level Security (RLS) policies.
- Physical IoT medical monitor serial/BLE integration.
- Tamper-evident append-only audit journal with cryptographic SHA-256 hash chains.
- High-availability clustering (99.95% uptime SLA, RPO $\le$ 1m, RTO $\le$ 15m).
- Enterprise SAML/OIDC SSO and automated Vault secret rotation.

### Phase 3: Regional Governance & Future Extensions
- Municipal Computer-Aided Dispatch (CAD 911/112/108) deep API integrations.
- Continuous 12-lead ECG waveform streaming.
- Bidirectional en-route WebRTC video consultation.
- Mass-casualty incident (MCI) auto-triage coordination.
