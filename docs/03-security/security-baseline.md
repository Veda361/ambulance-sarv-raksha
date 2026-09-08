# Security Baseline & Controls Specification

**Status:** APPROVED FOR PHASE 0  
**Compliance Standard:** All items relating to national healthcare frameworks or privacy directives are tagged `[REQUIRES LEGAL/COMPLIANCE REVIEW]`.

---

## 1. Authentication & Identity Management

### 1.1 User Authentication Architecture
* **Protocol Standards:** Implementation of OAuth 2.0 with OpenID Connect (OIDC) for user authentication.
* **Token Specifications:** Asymmetric JWTs (RS256 or Ed25519) with short-lived access tokens (15-minute expiration) and rotating, revocable refresh tokens stored in secure HTTP-only, SameSite cookies.
* **Multi-Factor Authentication (MFA):** Enforced MFA (TOTP / WebAuthn) for all Super Admin, Organization Admin, and Dispatcher roles. Mobile driver roles leverage hardware-bound device pairing with SMS OTP or biometric unlock. `[CONFIRMED]`
* **Enterprise Identity Federation:** Support for SAML 2.0 and OIDC enterprise federation allowing hospital networks to map corporate Active Directory / Okta identities directly into platform roles. `[PROPOSED]`

### 1.2 Edge Device & IoT Authentication
* **Hardware Device Identity:** Each in-vehicle IoT telematics gateway must be provisioned with a unique cryptographic identity (X.509 client certificate) for mutual TLS (mTLS) authentication. `[CONFIRMED]`
* **Mobile Device Binding:** Driver Android apps are bound to a verified `device_hardware_fingerprint` during onboarding. If a driver logs in on an unrecognized device, high-priority step-up authentication is triggered. `[CONFIRMED]`
* **Automated Device Revocation:** Compromised, lost, or decommissioned devices can be revoked instantly via a centralized Certificate Revocation List (CRL) or Redis-backed token blocklist. `[CONFIRMED]`

---

## 2. Authorization & Tenant Boundary Enforcement

### 2.1 Context-Aware Role-Based Access Control (RBAC)
* Permissions are evaluated at every API boundary using the tuple:  
  $$\text{Authorize}(\text{User}, \text{TenantID}, \text{Resource}, \text{Action})$$
* **No Blanket Access:** Possessing the role `DISPATCHER` does not grant access across the system; it grants access strictly within the scope of the user's assigned `tenant_id` and assigned dispatch sector.

### 2.2 Database Row-Level Security (RLS)
* As a defense-in-depth measure, tenant isolation is not entrusted solely to application code.
* The PostgreSQL database enforces native **Row-Level Security (RLS)**. Every database session initiated by application middleware sets a session variable:
  ```sql
  SET LOCAL app.current_tenant_id = 'tenant-uuid-here';
  ```
* Database policies enforce that any `SELECT`, `INSERT`, `UPDATE`, or `DELETE` query automatically appends an implicit `WHERE tenant_id = current_setting('app.current_tenant_id')`.

---

## 3. Cryptography & Data Protection Standards

| Data State | Minimum Cryptographic Standard | Key Management Lifecycle | Classification |
| :--- | :--- | :--- | :--- |
| **Data in Transit** | TLS 1.3 mandatory; TLS 1.2 minimum allowable cipher fallback (ECDHE-ECDSA-AES256-GCM-SHA384). Plaintext HTTP strictly blocked (HSTS enforced). | Automated certificate renewal via Let's Encrypt / AWS ACM; 90-day rotation. | `[CONFIRMED]` |
| **Data at Rest** | Full-disk and volume encryption using AES-256 (XTS mode). Database backups and object storage (S3) encrypted via envelope encryption. | Managed via AWS KMS / HashiCorp Vault; annual master key rotation. | `[CONFIRMED]` |
| **Field-Level Encryption (PHI)** | Highly sensitive patient fields (National ID, Patient Full Name, Phone Number) encrypted before database persistence using tenant-specific AES-256-GCM keys. | Keys isolated per tenant; rotated on security events. | `[PROPOSED]` |

---

## 4. Network Security & Perimeter Defense

* **Web Application Firewall (WAF):** Deployed at the API gateway layer to inspect and block OWASP Top 10 vulnerabilities (SQL injection, XSS, CSRF, path traversal).
* **DDoS & Rate Limiting:**
  - Standard REST APIs: Rate limited to 60 requests/minute per client IP.
  - Telematics Ingestion Endpoints: Rate limited dynamically per authenticated vehicle token (maximum 20 packets/second) with Redis token-bucket algorithms to prevent device runaway loops.
* **Network Segmentation:** Database and Redis clusters are placed in private, non-routable VPC subnets with zero direct public internet exposure. Access is restricted to application containers via internal security groups.

---

## 5. Secrets Management & Operational Security

* **Zero Plaintext Credentials:** API keys, database passwords, and third-party tokens are strictly prohibited from Git source control or plaintext Docker environment variables.
* **Dynamic Secret Injection:** Secrets are dynamically injected into container runtimes via HashiCorp Vault, AWS Secrets Manager, or Kubernetes Secrets with continuous rotation.
* **Vulnerability Scanning & SAST:** Mandatory CI/CD automated pipeline scans using Trivy (container image vulnerabilities) and SonarQube / Snyk (static code analysis). Zero high or critical CVEs allowed in production release builds.
