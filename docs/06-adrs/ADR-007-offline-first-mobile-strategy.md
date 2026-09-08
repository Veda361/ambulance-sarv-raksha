# ADR-007: Offline-First Mobile Strategy & Store-and-Forward Telemetry

**Status:** APPROVED  
**Date:** 2026-09-06  
**Deciders:** Principal Solution Architect, Mobile Engineering Lead, Systems Architect

---

## 1. Context
Ambulances operate in harsh RF environments. Vehicles routinely traverse cellular dead zones in rural valleys, underground highway tunnels, and concrete-shielded hospital emergency bay basements. Network loss lasting from 30 seconds to over 10 minutes is an unavoidable physical reality.

---

## 2. Problem
How does the mobile field application guarantee that drivers can execute mission state transitions, capture GPS tracks, and record clinical vitals without blocking the UI, throwing crash errors, or dropping critical legal records during complete network blackouts?

---

## 3. Evaluated Options
* **Option A: Online-Only with Simple Error Dialogs:** Require active internet for all operations; display "Network Disconnected - Retry" modal when offline.
* **Option B: Ephemeral In-Memory Queue:** Buffer failed requests in mobile RAM until network returns.
* **Option C: Persistent Offline-First Store-and-Forward via Encrypted SQLite (Room) (Recommended):** All local actions (state transitions, GPS coordinates, notes) are written synchronously to an encrypted local database first. A background synchronization worker drains the queue to the backend with guaranteed at-least-once delivery.

---

## 4. Decision
**Adopt Option C: Persistent Offline-First Architecture with Store-and-Forward Queue.**

1. **Local-First Writes:** When a driver taps "ARRIVED SCENE", the action is committed immediately to the local Room database with a local generation timestamp ($T_{local}$) and an incrementing local sequence number. The UI updates instantly.
2. **Background Sync Worker:** Android `WorkManager` and persistent Kotlin Coroutines monitor network connectivity constraints. When connectivity is verified, the client drains the queued events to the backend sequentially using exponential backoff.
3. **Server-Side Idempotency:** The backend ingests queued batches, validates sequence IDs, and processes events in chronological order, acknowledging processed records so the client can safely prune its local queue.

---

## 5. Rationale
* **Zero UI Blocking:** In a life-critical emergency, a driver cannot wait for a network timeout spinner to confirm they have arrived at the scene. The application must react instantly.
* **Zero Medicolegal Data Loss:** If an ambulance enters a hospital basement dead-zone with a critically ill patient, vitals recorded during those final 5 minutes are preserved on the device and uploaded the moment Wi-Fi or cellular signal connects, ensuring a complete clinical handover record.

---

## 6. Consequences
* **Positive:**
  - Complete operational resilience in any network condition.
  - Zero dropped GPS breadcrumbs or milestone timestamps.
  - Superior driver UX with instant screen responsiveness.
* **Negative:**
  - Additional engineering complexity on Android (managing local database schemas, conflict resolution, and background sync lifecycle).
