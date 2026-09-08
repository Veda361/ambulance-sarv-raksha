# ADR-005: Realtime Transport & Subscription Architecture

**Status:** APPROVED  
**Date:** 2026-09-06  
**Deciders:** Principal Solution Architect, Systems Architect, Lead Realtime Engineer

---

## 1. Context
The platform requires sub-second streaming of vehicle GPS coordinates, dynamic ETA countdowns, physiological vital signs, and urgent clinical alerts from field devices to dispatcher consoles and receiving emergency department web dashboards.

---

## 2. Problem
Which transport protocol and distributed messaging backplane should deliver real-time data to browser and mobile clients with minimal latency, low bandwidth consumption, and resilience to hospital enterprise firewall restrictions?

---

## 3. Evaluated Options
* **Option A: HTTP Short/Long Polling:** Clients query `/api/missions/{id}/updates` every 2–5 seconds. High HTTP header overhead; excessive server CPU; high latency.
* **Option B: WebSockets with Redis Pub/Sub Backplane (Recommended):** Bidirectional persistent full-duplex TCP connection. State changes published to Redis channels and broadcast to subscribed WebSocket server instances.
* **Option C: Server-Sent Events (SSE):** Unidirectional HTTP streaming from server to client with standard HTTP POST for client-to-server updates.
* **Option D: gRPC-Web Streaming:** High-performance protobuf streaming; requires specialized Envoy proxy translation for browser clients.

---

## 4. Decision
**Adopt Option B (WebSockets with Redis Pub/Sub Backplane) as Primary Transport**, complemented by **Server-Sent Events (SSE) as an automatic fallback** for hospital firewalls that block raw WebSocket upgrades.

* **Client Subscriptions:** Scoped by topic:
  - `tenant:{id}:dispatch` (Dispatcher fleet view)
  - `hospital:{id}:radar` (Emergency Department incoming view)
  - `mission:{id}:telemetry` (Dedicated mission vitals & GPS stream)
* **Backplane:** Horizontally scalable Redis cluster coordinating message broadcast across all running backend container nodes.

---

## 5. Rationale
* **Sub-Second Latency:** WebSocket frame overhead is minimal (2-8 bytes) compared to repetitive HTTP headers (500+ bytes), reducing cellular data consumption on mobile devices and keeping end-to-end latency below 300ms.
* **Full-Duplex Interactivity:** Drivers and triage nurses can acknowledge alerts and submit milestone transitions over the same persistent connection without renegotiating TLS handshakes.
* **Hospital Firewall Resilience:** Some locked-down hospital proxy servers drop non-HTTP long-lived TCP upgrades. Offering automatic fallback to Server-Sent Events (SSE) over standard HTTPS guarantees delivery across strict enterprise networks.

---

## 6. Consequences
* **Positive:**
  - Guaranteed sub-500ms delivery of critical physiological alerts.
  - Reduced cellular battery and bandwidth consumption on driver phones.
  - Horizontal scalability via stateless WebSocket container nodes.
* **Negative:**
  - Requires maintaining stateful connection tracking and reconnect backoff logic in web and mobile clients.
