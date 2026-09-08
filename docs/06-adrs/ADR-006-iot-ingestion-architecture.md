# ADR-006: Hardware Abstraction & IoT Telemetry Ingestion Architecture

**Status:** APPROVED  
**Date:** 2026-09-06  
**Deciders:** Principal Solution Architect, Systems Architect, Embedded / IoT Specialist

---

## 1. Context
Ambulances carry a diverse and fragmented ecosystem of edge equipment:
- Android smartphones and tablets (GPS, accelerometer).
- Vehicular OBD-II telematics trackers (Teltonika, CalAmp, Queclink).
- Dedicated edge microcontrollers (ESP32, STM32) acting as in-vehicle gateways.
- Commercial medical patient monitors (Mindray BeneHeart, Philips Tempus Pro, Zoll X Series).

Hardcoding the platform backend to a specific vendor's proprietary wire format creates severe vendor lock-in and prevents broad market adoption.

---

## 2. Problem
How can the platform ingest high-frequency telemetry from heterogeneous hardware sources while insulating core business logic from vendor-specific protocols?

---

## 3. Evaluated Options
* **Option A: Direct Ingestion into Core Domain:** Ingest proprietary packets directly into core mission handlers, parsing vendor formats within the primary web application.
* **Option B: Protocol Normalization Gateway & Hardware Abstraction Layer (HAL) (Recommended):** An ingestion layer terminating MQTT/HTTP connections, authenticating devices via mTLS, and converting raw byte streams into vendor-neutral canonical JSON/Protobuf domain events before passing them to the core domain bus.
* **Option C: Hardware-Only Mobile Aggregation:** Require all medical devices to connect locally via Bluetooth to the driver’s phone; the phone normalizes all data and transmits a single combined payload.

---

## 4. Decision
**Adopt Option B: Protocol Normalization Gateway with a Hardware Abstraction Layer (HAL).**

1. **Edge Normalization:** Ingestion endpoints accept data via two standardized protocols:
   - **HTTPS REST / WebSockets:** Used by Android mobile clients and software simulators.
   - **MQTT over TLS (mTLS):** Used by dedicated in-vehicle gateways (ESP32 / OBD-II / Linux gateways).
2. **Canonical Telemetry Schema:** Regardless of whether vitals originate from a Mindray monitor, a Philips defibrillator, or a software simulator, the HAL normalizes data into a canonical domain structure:
   ```json
   {
     "device_id": "DEV-ESP32-0091",
     "mission_id": "MSN-2026-00412",
     "timestamp": "2026-09-06T15:30:45.120Z",
     "sequence_id": 1402,
     "metrics": {
       "heart_rate_bpm": 118,
       "spo2_percent": 91,
       "bp_systolic_mmhg": 90,
       "bp_diastolic_mmhg": 60,
       "respiratory_rate_bpm": 24
     }
   }
   ```
3. **Idempotent Ingestion Buffer:** The gateway checks `(device_id, sequence_id)` against Redis to deduplicate retransmissions before writing to TimescaleDB.

---

## 5. Rationale
* **Zero Core Pollution:** The core mission lifecycle and clinical alert engines interact exclusively with canonical domain events. If a hospital introduces a new brand of ECG monitor, only a lightweight adapter parser is written in the HAL without altering core platform code.
* **Security Isolation:** Raw, potentially malformed byte packets from untrusted cellular connections are sandboxed at the gateway layer, preventing buffer overflow or injection attacks against the primary database.

---

## 6. Consequences
* **Positive:**
  - Complete vendor and hardware neutrality.
  - Software simulator in MVP maps 100% cleanly to future physical hardware ingestion.
  - Device authentication handled cleanly via mTLS at the perimeter.
* **Negative:**
  - Introduces a data normalization translation step at the edge gateway.
