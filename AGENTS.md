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

## 2. Current Progress & What's Done

### Backend (`server/`)
- **Models:** `QueueState` and `Token` schemas are decoupled and optimized with necessary compound indexes.
- **Services:**
  - `queueService.js`: Implements atomic token booking (`$inc`), token state management (`callNextPatient`, `checkInToken`, `completeConsultation`), Redis cache invalidation, and strict date filtering boundaries to prevent legacy tokens from polluting today's active queue.
  - `etaEngine.js`: Implements the `calculateWMA` and `calculateQueueETAs` functions.
- **WebSockets:** `queueSocket.js` successfully manages room joining/leaving, enforcing strict client isolation to prevent event leakage when switching contexts.
- **REST APIs:** Full suite of controllers and routes built out.

### Frontend (`client/`)
- **React App:** Vite-based React application utilizing Tailwind CSS.
- **State Management:** Fully integrated `SocketContext` providing real-time data sync, connection monitoring, and toast notification alerts for the entire app.
- **Views:** Split-screen testing view showing both the Clinic Desk and Patient Mobile views updating in sync.

### Recent Critical Fixes Applied
- **Date Leakage Bug:** Added `getTodayDateRange()` logic to `queueService.js` to ensure token queries only aggregate data for the current day.
- **WebSocket Room Leaks:** Refactored `queueSocket.js` to track `socket.currentDoctorId` and force clients to leave prior rooms before joining new ones.
- **Timer Inaccuracy:** Improved ETA data integrity by preventing the system from using skewed fallback times (like `updatedAt`) during server restarts if a consultation's precise start time was lost.

---

## 3. Future Work Plan & Implementation Roadmap

Agents picking up work from here should follow this prioritized roadmap.

### Phase 1: Robust System Hardening & Edge Case Handling
1. **Advanced Recovery & Resync:**
   - **Goal:** If the Redis cache fails entirely, the system should effortlessly rebuild state from MongoDB without error.
   - **Implementation:** Implement a "cache hydration" middleware that detects missing Redis keys on startup or post-crash and pre-warms the cache using `getQueueSnapshot`.
2. **Patient Notification Webhooks / SMS Integration Mock:**
   - **Goal:** The system needs a service layer hook to notify patients when they are next in line.
   - **Implementation:** Create a mock service (`notificationService.js`) that is triggered in `queueService.callNextPatient`. If the patient is 1 or 2 tokens away, simulate sending an SMS or Push Notification.
3. **Queue State Rollover / Midnight Cron:**
   - **Goal:** Automatically reset the `QueueState` for a new day.
   - **Implementation:** Create a lightweight cron job script (using `node-cron`) that runs at 23:59:59 to finalize all pending tokens for the day (e.g., marking them as 'SKIPPED' if still waiting) and pre-initialize a clean `QueueState` for the next day.

### Phase 2: Analytics & Historical Data
1. **Doctor Performance Analytics Dashboard:**
   - **Goal:** Build an endpoint that queries historical `Token` data to provide insights.
   - **Implementation:** Create `analyticsController.js` and a corresponding route that aggregates average consultation times, total patients seen per day, and emergency insertion rates over the last 7 or 30 days.

### Phase 3: Frontend Refinements & E2E Testing
1. **Frontend Connection Resilience UI:**
   - **Goal:** Provide better user feedback during temporary network drops.
   - **Implementation:** Enhance the `SocketContext` in the React frontend to display an overlay or prominent banner when `isConnected` drops to `false`, pausing interactions until reconnected.
2. **End-to-End Test Suite Setup:**
   - **Goal:** Ensure critical paths don't regress.
   - **Implementation:** Configure Playwright to spin up both the server and client, book a token, call the next patient, and verify the ETA shifts correctly on the patient view.

---

## 4. Operational Guidelines for Agents
1. **Strictly Date-Bound Queries:** Any time you write a query against the `Token` model, you **must** scope it to the current day using `bookingTime` unless explicitly building historical analytics.
2. **Preserve Atomicity:** Do not modify the token generation logic to use read-then-write anti-patterns. Always rely on `$inc` in MongoDB to prevent race conditions.
3. **Embrace Event-Driven Updates:** Never implement polling on the frontend. If a state changes on the backend, ensure a Socket.io event is emitted to synchronize the clients.