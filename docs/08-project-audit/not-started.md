# What Is Not Started

**Audit Date:** 2026-09-08

---

## Major Capabilities With No Meaningful Implementation

| # | Capability | Phase | Impact | Dependency |
|---|-----------|-------|--------|------------|
| 1 | **Hospital Operations Dashboard** | 2 | CRITICAL — no user-facing interface exists for hospital staff | Phase 1 backend APIs (ready) |
| 2 | **Android Driver/EMT Application** | 3 | CRITICAL — field personnel have no mobile tool; scaffold-only project exists | Phase 1 backend APIs (ready) |
| 3 | **Push Notifications** (FCM/APNs) | 10 | HIGH — no way to alert drivers of new missions or hospitals of arrivals | Android app, notification provider |
| 4 | **SMS/Email Notifications** | 10 | MEDIUM — no communication channel beyond WebSocket | Notification provider (Twilio/SES) |
| 5 | **Offline-First Mobile** (Room DB, sync queue) | 11 | HIGH — ambulances operate in areas with poor connectivity | Android app implementation |
| 6 | **Advanced Dispatch Algorithm** (auto-assignment, load balancing) | 13 | HIGH — currently manual assignment only | Fleet data, algorithm design |
| 7 | **Government/EMS Command Center** | 14 | MEDIUM — GOVERNMENT_OPERATOR role defined but no UI | Web dashboard framework |
| 8 | **Analytics & Reporting** | 15 | MEDIUM — no operational metrics, dashboards, or reports | Data collection |
| 9 | **Subscription/SaaS Billing** | 16 | LOW (pre-revenue) — no billing, feature gating, or payment | Core platform completion |
| 10 | **External API Gateway** | 17 | LOW — no third-party integrations | API stabilization |
| 11 | **Rate Limiting** | 19 | HIGH — login and API endpoints have no rate limiting | None (can be added immediately) |
| 12 | **Security Headers** (Helmet/HSTS/CSP) | 19 | HIGH — no security headers on HTTP responses | None (can be added immediately) |
| 13 | **HTTPS/TLS Enforcement** | 19 | CRITICAL for production — no TLS configuration | Infrastructure |
| 14 | **Backup & Disaster Recovery** | 20 | CRITICAL for production — no backup strategy | PostgreSQL deployment |
| 15 | **Monitoring Stack** (Prometheus/Grafana/Alerting) | 21 | HIGH — health probes exist but no monitoring consumes them | Infrastructure |
| 16 | **Load Testing / Performance** | 22 | MEDIUM — no performance baseline | Infrastructure |
| 17 | **CI/CD Pipeline** | 24 | HIGH — no automated build, test, or deploy | None (can be created immediately) |
| 18 | **Dockerization** | 24 | HIGH — no containerization | None (can be created immediately) |
| 19 | **Infrastructure as Code** | 24 | MEDIUM — no Terraform, no Kubernetes manifests | Cloud provider selection |
| 20 | **Compliance Framework** (consent, data retention, auditor access) | 25 | CRITICAL for production — PHI redaction exists but no compliance framework | Legal requirements |
| 21 | **Pilot Deployment** | 26 | BLOCKED — requires Phases 2, 3, security | Everything above |
| 22 | **Production Launch** | 28 | BLOCKED — requires all prerequisites | Everything above |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Not Started (critical) | 5 |
| Not Started (high) | 8 |
| Not Started (medium) | 5 |
| Not Started (low) | 2 |
| Not Started (blocked) | 2 |
| **Total** | **22** |
