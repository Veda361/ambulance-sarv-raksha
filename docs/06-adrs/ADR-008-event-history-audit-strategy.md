# ADR-008: Event History, Auditability, and Medicolegal Tamper-Evidence

**Status:** APPROVED  
**Date:** 2026-09-06  
**Deciders:** Principal Solution Architect, Security Architect, Legal/Compliance Advisor  
**Legal Classification:** `[REQUIRES LEGAL/COMPLIANCE REVIEW]`

---

## 1. Context
Pre-hospital emergency operations involve severe medicolegal liabilities (e.g., patient death en route, allegations of delayed ambulance arrival, disputed drug administrations, or disputed handover timing). During post-incident investigations or court proceedings, the integrity of operational timestamps and clinical records is scrutinized.

A mutable database where rows are updated in-place (`UPDATE missions SET state = 'ARRIVED'`) cannot withstand forensic legal scrutiny, as an adversary or disgruntled insider could alter timestamps post-hoc.

---

## 2. Problem
How must mission event history and audit logs be structured and preserved to guarantee tamper-evidence, non-repudiation, and regulatory compliance?

---

## 3. Evaluated Options
* **Option A: Standard Database Update with Timestamp Columns:** Traditional `updated_at` timestamps on mutable records.
* **Option B: Application-Level Event Logging to Files:** Logging events to JSON files rotated into Elasticsearch/Loki.
* **Option C: Append-Only Relational Audit Journal with Cryptographic Hash Chaining (Recommended):** Every state change emits an immutable event stored in a Write-Once-Read-Many (WORM) table. Each event links to the cryptographic SHA-256 hash of the preceding event for that mission, creating an immutable audit chain.

---

## 4. Decision
**Adopt Option C: Append-Only Audit Journal with Cryptographic Hash Chaining.**

1. **Write-Once-Read-Many (WORM) Table:** An `audit_mission_events` table enforces that only `INSERT` queries are permitted. Database permissions and triggers explicitly raise an exception on any `UPDATE` or `DELETE` statement.
2. **Cryptographic Hash Chain:** Each event record contains:
   $$\text{Hash}_N = \text{SHA256}(\text{Hash}_{N-1} + \text{Timestamp} + \text{ActorID} + \text{State} + \text{Payload})$$
3. **Dual Record Archival:** Upon mission completion (`MISSION_COMPLETED`), the system compiles an immutable **Mission Manifest** (ePCR, milestone timestamps, vital trends, and digital signatures), cryptographically seals it, and uploads it to an encrypted, object-locked S3 bucket configured for statutory retention (7 years).

---

## 5. Rationale
* **Non-Repudiation in Malpractice Defense:** By linking each event to the preceding event's hash, it is mathematically impossible to alter a historical timestamp (e.g., retroactively modifying dispatch arrival time) without breaking the entire chain of hashes.
* **Medicolegal Defensibility:** Provides absolute proof to hospital leadership, insurance underwriters, and judicial authorities that the pre-hospital record was generated in real time as the emergency unfolded.

---

## 6. Consequences
* **Positive:**
  - Impregnable forensic audit trail.
  - High confidence for enterprise hospital legal counsels.
  - Effortless historical event replay for post-incident reviews.
* **Negative:**
  - Slight computational overhead on event insertion (hashing overhead is negligible at ~50 microseconds).
  - Storage consumption increases monotonically; mitigated by cold-storage archival.
