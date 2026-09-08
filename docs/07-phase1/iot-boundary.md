# IoT & Edge Hardware Boundary Specification

**Document ID:** `docs/07-phase1/iot-boundary.md`  
**Status:** COMPLETED / VERIFIED  
**Parent Decision:** Phase 0 ADR-006

---

## 1. Hardware Abstraction Philosophy

The platform treats all edge IoT hardware (OBD-II vehicle dongles, ESP32 cellular gateways, and medical patient monitor bridges) as **untrusted external data sources**.
- Devices are strictly decoupled from human user identities.
- Devices can never directly update mission states or modify database records.
- Ingestion converts raw incoming telemetry into canonical domain events.

```
[ In-Vehicle Hardware ]
  • OBD-II GPS Tracker (Teltonika / CalAmp)
  • In-Vehicle Gateway (ESP32 / STM32)
  • Patient Monitor (Mindray / Philips)
          │
          ▼ (HTTPS POST /telemetry with API Key Hash)
[ Device Ingestion Gateway ]
          │
          ├──► Authenticates API Key Hash in `devices` table
          ├──► Updates `last_heartbeat_at` timestamp
          ├──► Deduplicates sequence numbers: (mission_id, sequence_number)
          │
          ▼
[ Canonical Ingestion Handlers ]
  • LocationService.recordLocation()
  • ClinicalService.recordVitals()
```

---

## 2. Telemetry Idempotency & Deduplication

In cellular transit, vehicles frequently retransmit packets due to dropped TCP ACK frames. If untreated, retransmissions corrupt vehicle speeds, average ETAs, and inflate time-series storage.

### Idempotency Enforcement Mechanism:
1. **Edge Monotonic Sequence Number:** Every telemetry packet carries an incrementing integer `sequence_number`.
2. **Database Constraint:** A unique compound constraint `uq_location_mission_seq UNIQUE (mission_id, sequence_number)` is enforced in PostgreSQL.
3. **Graceful Deduplication:** `LocationService.recordLocation()` checks for existing sequence numbers before insertion. Duplicate packets return `{ deduplicated: true }` with HTTP 200 OK without executing secondary database writes or WebSocket broadcasts.

---

## 3. Device Lifecycle & Registration
1. **Registration (`POST /api/v1/devices`):** Administrator registers device identifier and hardware type (`OBD2_TRACKER`, `ESP32_GATEWAY`, `STM32_MONITOR_BRIDGE`). Returns raw API key once.
2. **Key Storage:** Server stores only the SHA-256 hash of the API key (`api_key_hash`).
3. **Revocation:** Administrator can toggle `status = 'REVOKED'`, instantly dropping all incoming telemetry from that physical unit.
