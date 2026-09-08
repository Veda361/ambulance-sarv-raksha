# ADR-001: Modular Monolith vs. Microservices Architecture

**Status:** APPROVED  
**Date:** 2026-09-06  
**Deciders:** Principal Solution Architect, Systems Architect, Lead Backend Engineer  
**Consulted:** DevOps Lead, Mobile Engineering Lead

---

## 1. Context
The Ambulance Coordination Platform coordinates life-critical emergency responses across dispatch, vehicle tracking, clinical alerting, and hospital handovers. The initial engineering phases require rapid iteration, deterministic transaction guarantees across core entities (Mission, Ambulance, Patient, Handover), and simple developer setup. 

A common pitfall in modern healthcare startups is adopting a distributed microservices architecture prematurely, resulting in distributed transaction failures (dual-write anomalies), network latency overhead across RPC calls, high operational cognitive load, and complex distributed tracing during early pilot stages.

---

## 2. Problem
Which architectural topology should govern the platform core backend for MVP (Phase 1) and early commercial production (Phase 2):
1. A Distributed Microservices Architecture (10+ decoupled services)?
2. A Decoupled Modular Monolith with an asynchronous domain event bus?
3. An unstructured Monolithic application?

---

## 3. Evaluated Options

### Option A: Distributed Microservices Architecture
* *Description:* Split the system immediately into independent microservices (Auth Service, Mission Service, Dispatch Service, Telematics Service, Clinical Service, Notification Service, Billing Service) communicating via gRPC and Kafka.
* *Pros:* Independent deployment cycles per team; isolated service scalability.
* *Cons:* Severe operational tax; distributed transaction complexity (Saga patterns required for mission-dispatch-handover); increased network serialization latency in life-critical loops; complex local developer environment requiring Kubernetes/minikube.

### Option B: Decoupled Modular Monolith (Recommended)
* *Description:* A single deployable backend artifact structured internally into strictly isolated domain modules (bounded contexts) communicating via clean internal TypeScript/Go service interfaces and an in-process asynchronous domain event bus.
* *Pros:* ACID transactional consistency across related domain updates; sub-millisecond in-process call latency; simple single-container deployment; rapid local development; zero network serialization overhead between modules.
* *Cons:* Requires discipline to prevent developers from bypassing module boundaries; monolithic horizontal scaling (scaling the entire container rather than just the telematic ingestion loop).

### Option C: Traditional Unstructured Monolith
* *Description:* Rapid prototyping without enforced internal boundaries, direct cross-table database queries, and tightly coupled models.
* *Pros:* Fastest initial prototype hacking.
* *Cons:* Rapid technical debt accumulation; impossible to split later; unmaintainable spaghetti code.

---

## 4. Decision
**Adopt Option B: Decoupled Modular Monolith** for Phase 1 (MVP) and Phase 2 (Production).

The backend codebase will be structured into distinct internal modules (`auth`, `organization`, `fleet`, `dispatch`, `mission`, `clinical`, `realtime`, `audit`). Modules may only interact through published public interfaces and asynchronous domain events. Direct database cross-joins across module boundaries are forbidden.

---

## 5. Rationale
* **Life-Critical Transactional Integrity:** State transitions (e.g., assigning an ambulance while updating mission state and releasing previous reservations) require atomic database transactions. Distributed sagas introduce edge-case failure modes where an ambulance could be double-booked during network partitions.
* **Engineering Velocity:** In Phase 0 and Phase 1, the core domain model is still evolving. Refactoring boundaries within a modular monolith is a simple in-IDE refactor, whereas refactoring across microservices requires coordinating multiple API version deployments and database migrations.
* **Predictable Latency:** In-process method execution is measured in microseconds, avoiding the millisecond network hops inherent in microservice RPC calls.

---

## 6. Consequences
* **Positive:**
  - Fast local testing and single-command CI/CD build.
  - Zero distributed transaction failures during emergency dispatch.
  - Simplified operational observability and logging.
* **Negative:**
  - High-frequency telemetry ingestion (GPS streaming from thousands of vehicles) shares compute with standard REST APIs until scaled out.
  - Requires strict static linting rules (e.g., `dependency-cruiser` or Nx boundaries) to prevent cross-module coupling.

---

## 7. Revisit Conditions
This decision will be formally revisited when:
1. Active fleet scale exceeds **5,000 simultaneously streaming ambulances**, requiring the high-frequency Telematics Ingestion module to be carved out into an independent, stateless Go/Rust microservice.
2. The engineering organization scales beyond **4 independent product engineering squads** experiencing continuous deployment merge friction.
