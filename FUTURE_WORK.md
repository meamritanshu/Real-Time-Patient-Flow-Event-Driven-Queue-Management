# MediQ: Current Progress & Future Implementation Plan

This document serves as the project tracker and detailed roadmap for the **Real-Time Patient Flow and Event-Driven Queue Management** (MediQ) project. It records what has been successfully implemented, and outlines the phased future work required to harden the system and add robust features.

---

## 1. Current Progress: What is Done

### Backend (`server/`)
- **Schema & Database:** Decoupled `QueueState` and `Token` schemas are implemented in MongoDB with appropriate compound indexes.
- **Concurrency & Booking:** Atomic token booking is fully functional using MongoDB `$inc`, ensuring zero duplicate tokens under simultaneous requests.
- **Caching:** Redis is integrated to cache live queue states, minimizing database load. Cache invalidation happens synchronously on state changes.
- **Dynamic ETA Engine:** The Weighted Moving Average (WMA) algorithm is operational, dynamically calculating wait times based on a rolling window of recent consultation durations.
- **Real-Time Synchronization (WebSockets):** `queueSocket.js` successfully manages room joining/leaving by `doctorId`, enforcing strict client isolation and publishing real-time state updates without HTTP polling.
- **Recent Hardening (Bug Fixes Applied):**
  - **Date Scoping:** All token-related queries are strictly scoped to the current day (`bookingTime`) to prevent historical token leakage.
  - **Socket Room Isolation:** Fixed room leakage bugs; clients must leave previous rooms before joining new ones when switching context.
  - **Timer Integrity:** Eliminated skewed ETA data by ensuring consultation durations are only calculated when a valid `consultationStartTime` exists (resilient to server restarts).

### Frontend (`client/`)
- **React App:** Vite + React + Tailwind CSS architecture is established.
- **Real-Time State:** `SocketContext` manages the Socket.io connection, real-time data sync, and global toast notification alerts.
- **Dual-Interface View:**
  - **Clinic Desk:** Interface for staff to advance queue, trigger emergencies, skip, or pause.
  - **Patient View:** Live mobile-first dynamic token card showing ETA and position in line.
  - **Split View:** Development interface displaying both views side-by-side.

---

## 2. Future Work & Implementation Roadmap

The following phases outline the strategic steps necessary to finalize the project for production deployment and extend its functionality.

### Phase 1: Robust System Hardening & Edge Case Handling
1. **Advanced Cache Recovery & Resync:**
   - **Goal:** If the Redis instance fails or clears entirely, the Node.js application should effortlessly rebuild the live state from MongoDB without throwing 500 errors to the client.
   - **Implementation:** Build a "cache hydration" utility that triggers when a Redis lookup returns `null` or on server startup. It should aggregate the `QueueState` and `Token` data directly from MongoDB to pre-warm the cache.
2. **Notification Service Mock (Webhooks / SMS):**
   - **Goal:** The system needs a decoupled service layer to alert patients when they are next in line.
   - **Implementation:** Create a mock service (`notificationService.js`) triggered within `queueService.callNextPatient`. If a patient's `tokensAhead` drops to 1 or 2, simulate logging an SMS payload or firing a webhook to a generic endpoint.
3. **Queue State Rollover (Midnight Cron Job):**
   - **Goal:** Automatically reset and clear the queue state for a new operational day without manual intervention.
   - **Implementation:** Integrate `node-cron` to execute a script daily at 23:59:59. The script should:
     - Mark all pending/waiting tokens for the day as 'SKIPPED' or 'EXPIRED'.
     - Archive the day's `QueueState`.
     - Pre-initialize a clean `QueueState` document for the upcoming day.

### Phase 2: Analytics & Historical Insights
1. **Doctor Performance Analytics Dashboard:**
   - **Goal:** Provide clinic administrators with insights into efficiency and patient flow volume.
   - **Implementation:**
     - Create `analyticsController.js` and `analyticsRoutes.js`.
     - Build aggregation pipelines in MongoDB to query historical `Token` data.
     - Metrics to expose: Average daily consultation time, total patients seen per day, peak wait times, and emergency insertion rates (over the last 7, 30, or 90 days).
2. **Patient Flow Heatmaps:**
   - **Goal:** Visualize peak booking and walk-in times.
   - **Implementation:** Expand the analytics endpoint to bucket token bookings by hour of the day.

### Phase 3: Frontend Refinements & Testing
1. **Frontend Connection Resilience UI:**
   - **Goal:** Provide explicit user feedback during temporary network drops or WebSocket disconnections.
   - **Implementation:** Enhance the `SocketContext` in the React frontend. When `isConnected` drops to `false`, overlay a prominent banner (e.g., "Connection lost. Reconnecting...") and disable actionable buttons (Call Next, Emergency) until reconnected.
2. **End-to-End Test Suite:**
   - **Goal:** Ensure critical booking and ETA paths do not regress during future development.
   - **Implementation:** Setup Playwright. Write E2E flows that spin up both server and client, book a token, advance the queue, and verify that the ETA dynamically shifts on the Patient View interface.
