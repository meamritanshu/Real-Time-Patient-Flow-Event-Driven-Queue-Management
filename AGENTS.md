# MediQ Project Guide & Future Work Plan for Agents

This document serves as the central source of truth for the **Real-Time Patient Flow and Event-Driven Queue Management** (MediQ) project. It outlines the project's background, core architectural methodology, current progress, and the detailed future work plan. **All agents working on this project MUST read and adhere to the guidelines and specifications detailed in this document.**

---

## 1. Project Overview & Core Architectural Methodology

MediQ is a real-time, event-driven dynamic queuing platform designed to replace rigid appointment time slots in outpatient departments (OPDs).

### Core Pillars
1. **Schema Decoupling & Concurrency Control (MongoDB):**
   - Separates static entities (e.g., Doctors, Patients) from volatile live queue counters (`QueueState`).
   - Uses MongoDB atomic operators (`$inc`, `findOneAndUpdate`) for strictly sequential, race-condition-free token generation.
2. **In-Memory Caching (Redis):**
   - Caches live queue states (`queue:state:${doctorId}`) with an expiration TTL to handle high-frequency lookups and reduce DB load.
3. **Dynamic ETA Engine (Weighted Moving Average - WMA):**
   - Wait times are calculated dynamically based on a doctor's actual recent consultation speeds using a rolling window WMA algorithm: `(w1*t1 + w2*t2 + ... + wn*tn) / sum(w)`.
   - The current baseline weights are `[0.1, 0.2, 0.3, 0.4]` for the last 4 consultations.
4. **Real-Time State Synchronization (Socket.io):**
   - Sub-second updates pushed to connected clients via a Pub/Sub model.
   - Rooms are isolated strictly by `doctorId`.
5. **Dual-Interface React Frontend:**
   - **Clinic Control Desk (Desktop-First):** Used by staff to advance the queue, trigger emergency triage, pause sessions, or skip patients.
   - **Patient Mobile View (Mobile-First):** Displays live dynamic token card, ETA countdown, and connection status.

---

## 2. Project Tracking

For a detailed record of current progress, completed bug fixes, and the step-by-step roadmap for future implementation phases, please refer to the `FUTURE_WORK.md` document in the root of the repository.

---

## 4. Operational Guidelines for Agents
1. **Strictly Date-Bound Queries:** Any time you write a query against the `Token` model, you **must** scope it to the current day using `bookingTime` unless explicitly building historical analytics.
2. **Preserve Atomicity:** Do not modify the token generation logic to use read-then-write anti-patterns. Always rely on `$inc` in MongoDB to prevent race conditions.
3. **Embrace Event-Driven Updates:** Never implement polling on the frontend. If a state changes on the backend, ensure a Socket.io event is emitted to synchronize the clients.