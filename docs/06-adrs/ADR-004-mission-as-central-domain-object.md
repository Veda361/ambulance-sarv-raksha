# ADR-004: Mission as the Central Domain Aggregate Root

**Status:** APPROVED  
**Date:** 2026-09-06  
**Deciders:** Principal Solution Architect, Systems Architect, Lead Domain Modeler

---

## 1. Context
Emergency medical operations involve disparate actors: ambulances, drivers, EMTs, patients, callers, receiving hospitals, and medical monitors. In earlier telematics or hospital ticketing systems, software was frequently modeled around the **Vehicle** (fleet tracking mindset) or the **Patient** (electronic health record mindset).

---

## 2. Problem
What is the primary Aggregate Root in Domain-Driven Design (DDD) that governs the operational lifecycle, transactions, and event generation across the system?

---

## 3. Evaluated Options
* **Option A: Vehicle-Centric Model:** The Ambulance is the primary entity; missions are treated as trips or assignments attached to a vehicle.
* **Option B: Patient-Centric Model:** The Patient is the primary entity; transit is treated as an encounter or transport episode.
* **Option C: Mission-Centric Model (Recommended):** The **Mission** is the first-class Aggregate Root. A Mission binds an emergency distress event, a patient, an allocated vehicle, assigned crew, destination hospital, dynamic route, and clinical handover into an atomic operational lifecycle.

---

## 4. Decision
**Adopt Option C: Elevate Mission as the First-Class Domain Aggregate Root.**

All state transitions, real-time telemetry subscriptions, access delegations, and audit entries are keyed by `mission_id`. Vehicles and Crew transition between availability pools by binding and unbinding from active Missions.

---

## 5. Rationale
* **Dynamic Reassignment Flexibility:** If an ambulance breaks down en route to a scene, a Vehicle-centric model breaks down. In a Mission-centric model, the Mission simply unbinds Ambulance 01 and binds Ambulance 02 without losing the caller history, patient notes, or dispatch timestamps.
* **Medicolegal Cohesion:** In a malpractice lawsuit or contractual audit, investigators do not query "what did Ambulance 04 do all year"; they subpoena the specific **Mission Record** containing the sequence of distress call, dispatch delay, transit telemetry, physiological changes, and triage nurse sign-off.
* **Clean State Transitions:** The Mission finite state machine (`REQUESTED` to `COMPLETED`) provides a deterministic, unambiguous lifecycle governing the entire pre-hospital episode.

---

## 6. Consequences
* **Positive:**
  - High domain clarity across engineering, product, and clinical teams.
  - Effortless cross-entity coordination and event sourcing.
  - Simplified audit logging and billing calculation.
* **Negative:**
  - Non-emergency vehicle movements (e.g., driving to a maintenance garage) do not fit the standard emergency mission lifecycle and must be modeled as a specialized maintenance trip.
