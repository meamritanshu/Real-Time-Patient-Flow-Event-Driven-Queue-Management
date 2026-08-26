# Implementation Plan: Real-Time Patient Flow and Event-Driven Queue Management

Build a production-ready Minimum Viable Product (MVP) for **"Real-Time Patient Flow and Event-Driven Queue Management"** with a clean monorepo architecture:
1. **`server/`**: Express, Socket.io, Mongoose (MongoDB), ioredis (Redis) with automatic fallback for zero-friction local development, dynamic WMA ETA engine, and concurrency-safe atomic token booking.
2. **`client/`**: Vite + React, Tailwind CSS, Lucide React, and Socket.io client featuring an interactive dual interface (Clinic Control Desk, Patient Mobile View, and Side-by-Side Split View).

---

## User Review Required

> [!IMPORTANT]
> **Zero-Friction In-Memory Fallback Strategy**: 
> Neither standalone `mongod` nor `redis-server` are currently running on this machine. To ensure the project starts immediately with `npm run dev` without requiring manual database installation, we will implement an automatic fallback layer:
> - **MongoDB**: Connects to `process.env.MONGODB_URI` if reachable; otherwise starts `mongodb-memory-server` or an in-memory Mongoose instance transparently.
> - **Redis**: Connects to `process.env.REDIS_URL` if reachable; otherwise falls back gracefully to `ioredis-mock` (fully compatible in-memory Redis command engine).
> Real MongoDB and Redis connections remain fully supported via `.env` configuration.

> [!TIP]
> **Side-by-Side Dual View**:
> In addition to individual views for Clinic Control Desk and Patient Mobile View, we will include a **Split / Side-by-Side View** option. This allows demonstrating live real-time WebSocket synchronization within a single browser window (e.g. clicking "Call Next Patient" on the left immediately updates the patient mobile card on the right).

---

## Proposed Architecture & File Structure

```
MediQ/
├── package.json                   # Root orchestrator scripts (dev, build, seed, install)
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── .env
│   └── src/
│       ├── server.js              # Express app, HTTP server, Socket.io initialization
│       ├── config/
│       │   ├── db.js              # MongoDB connection with auto in-memory fallback
│       │   └── redis.js           # Redis client with ioredis-mock fallback
│       ├── models/
│       │   ├── QueueState.js      # ClinicId, doctorId, date, tokens, status, durations
│       │   └── Token.js           # TokenNumber, patientName, status, priority, timestamps
│       ├── services/
│       │   ├── etaEngine.js       # Dynamic Weighted Moving Average (WMA) calculator
│       │   └── queueService.js    # Concurrency-safe atomic booking, next, complete, skip
│       ├── controllers/
│       │   └── queueController.js # REST API handlers for booking, checkin, next, complete...
│       ├── routes/
│       │   └── queueRoutes.js     # REST endpoint routing
│       ├── sockets/
│       │   └── queueSocket.js     # Socket.io room management & broadcast handlers
│       └── seed.js                # Default seed script for Dr. Ananya Sharma (dr_sharma_01)
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                # Layout, header, view switcher, socket status
│       ├── index.css              # Tailwind base & custom medical glassmorphism styling
│       ├── context/
│       │   └── SocketContext.jsx  # Real-time WebSocket provider & state synchronization
│       ├── components/
│       │   ├── Header.jsx         # App bar, live socket status, view switcher
│       │   ├── DoctorSelector.jsx # Switch active doctor
│       │   ├── clinic/
│       │   │   ├── ClinicDesk.jsx # Doctor & receptionist control panel
│       │   │   ├── ActiveConsultationCard.jsx # Serving token, ticking stopwatch, WMA
│       │   │   ├── ControlBar.jsx # Next, Complete, Skip, Pause/Resume, Emergency
│       │   │   ├── QueueTable.jsx # Live waiting list, status pills, manual actions
│       │   │   └── EmergencyModal.jsx # Rapid triage patient insertion
│       │   └── patient/
│       │       ├── PatientMobileView.jsx # Smartphone mockup & interactive experience
│       │       ├── TokenCard.jsx  # Large token display, now serving, visual count ahead
│       │       ├── DynamicEtaDisplay.jsx # Live WMA ETA counter & status indicator
│       │       ├── SelfCheckInButton.jsx # Instant arrival check-in
│       │       └── BookingModal.jsx # On-demand token booking simulation
│       └── utils/
│           └── formatters.js      # Time formatting, duration display, status colors
```

---

## Detailed Specifications

### 1. Database Schemas (`server/src/models/`)
- **`QueueState`**:
  - `clinicId`: String (indexed)
  - `doctorId`: String (indexed)
  - `date`: String (YYYY-MM-DD)
  - `currentServingToken`: Number (default: 0)
  - `lastIssuedToken`: Number (default: 0)
  - `status`: Enum `['ACTIVE', 'PAUSED']` (default: `'ACTIVE'`)
  - `recentConsultationDurations`: Array of Numbers (minutes, rolling window of last 5)
  - Unique compound index: `{ doctorId: 1, date: 1 }`
- **`Token`**:
  - `tokenNumber`: Number (required)
  - `patientName`: String (required)
  - `phoneNumber`: String
  - `doctorId`: String (required, indexed)
  - `status`: Enum `['BOOKED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED', 'EMERGENCY']`
  - `bookingTime`, `checkInTime`, `consultationStartTime`, `consultationEndTime`: Dates
  - `priorityScore`: Number (default: 0; emergency = 100)
  - Indexes on `{ doctorId: 1, status: 1 }` and `{ doctorId: 1, tokenNumber: 1 }`

### 2. Concurrency-Safe Atomic Booking & State Transitions
- **Atomic Booking**:
  Uses MongoDB atomic `$inc` on `QueueState.lastIssuedToken` via:
  ```js
  const queueState = await QueueState.findOneAndUpdate(
    { doctorId, date },
    { 
      $inc: { lastIssuedToken: 1 },
      $setOnInsert: { clinicId, currentServingToken: 0, status: 'ACTIVE', recentConsultationDurations: [10] }
    },
    { upsert: true, new: true }
  );
  ```
  Guarantees **zero race conditions and no duplicate tokens** under high-concurrency loads.
- **Redis Cache Layer**:
  - Fast read snapshot cached at `queue:state:${doctorId}` with a 60-second TTL.
  - Automatically invalidated/refreshed on any state mutation.

### 3. Dynamic ETA Engine (Weighted Moving Average)
- **Consultation Duration Calculation**:
  When a doctor marks a consultation completed, elapsed minutes are calculated:
  $\Delta t = \max(1, \text{round}((\text{endTime} - \text{startTime}) / 60000))$.
  Pushed into `recentConsultationDurations` (retaining the most recent 5).
- **Weighted Moving Average (WMA)**:
  - Weights: `[0.1, 0.2, 0.3, 0.4]` applied to the last 4 consultations.
  - Normalized if fewer than 4 consultations exist; default baseline of 10 minutes if no history exists.
- **Dynamic ETA for Token $K$**:
  $$\text{Dynamic ETA} = (\text{Tokens Ahead of } K) \times \text{WMA} + \max(0, \text{WMA} - \text{Elapsed Consultation Time})$$
  Accounts for emergency patients prioritized ahead.

### 4. REST API & WebSocket Real-Time Events
- **REST Endpoints**:
  - `POST /api/queue/book` - Atomically books a token.
  - `POST /api/queue/checkin` - Patient arrival check-in.
  - `POST /api/queue/next` - Doctor calls the next patient (emergency/priority first, then sequential).
  - `POST /api/queue/complete` - Completes consultation, records duration, updates WMA.
  - `POST /api/queue/skip` - Moves absent patient to a skipped buffer.
  - `POST /api/queue/emergency` - Inserts an urgent triage patient immediately behind the currently serving token.
  - `POST /api/queue/toggle-pause` - Pauses/resumes the queue for doctor breaks.
  - `GET /api/queue/state/:doctorId` - Returns the complete queue snapshot with calculated ETAs.
- **WebSocket Broadcasts (`socket.io`)**:
  - Room: `socket.join(doctorId)`.
  - Broadcasts emitted upon any mutation:
    - `queue:state_updated` (complete fresh snapshot)
    - `queue:next_called` (patient call alert)
    - `queue:emergency_alert` (emergency alert toast)
    - `queue:eta_updated` (updated ETAs for active tokens)

### 5. Frontend Interfaces (`client/`)
- **Header & Navigation**:
  - Status indicator with animated pulse ring (Connected vs Disconnected).
  - View selector: `Clinic Control Desk`, `Patient Mobile View`, and `Side-by-Side Dual View`.
  - Doctor switch dropdown (default: `dr_sharma_01`).
- **Interface 1: Clinic Control Desk**:
  - Doctor status badge (`ACTIVE` / `PAUSED`).
  - Active Consultation Card with ticking stopwatch timer (`mm:ss`), token number, and patient name.
  - Action Control Bar: Call Next, Complete, Skip, Pause/Resume, and Emergency Triage.
  - Live Queue Table with status badges (Booked, Checked In, In Consultation, Emergency) and actions.
  - Skipped Patients Buffer with "Recall" button.
- **Interface 2: Patient Mobile View**:
  - Sleek smartphone frame with simulated notch and status bar.
  - Token switcher / selector to view any booked token or book a new one.
  - Hero Token Card: **"Your Token: #15"**, **"Now Serving: #12"**, **"3 Patients Ahead"**.
  - Dynamic Live ETA Counter: **"Estimated Wait: ~18 mins"** with visual progress indicator.
  - One-click **"Self Check-In"** button with arrival timestamp confirmation.

---

## Verification Plan

### Automated & API Tests
1. **Server Health & API Verification**:
   - Run seed script to populate `dr_sharma_01` and active tokens.
   - Test concurrent booking requests using a script to verify atomic incrementing without duplicates.
   - Test state transition API flow: `book` -> `checkin` -> `next` -> `complete` -> verify WMA update and ETA shift.
   - Test emergency insertion: verify emergency token moves ahead of standard tokens.
   - Test pause/resume toggle.

2. **WebSocket Real-Time Verification**:
   - Verify connection handshake, room joining, and broadcast receipts for `queue:state_updated`, `queue:next_called`, `queue:emergency_alert`.

3. **Frontend Verification**:
   - Verify client builds with Vite (`npm run build`).
   - Use browser subagent to interactively load the web app, test the dual view, click "Call Next Patient", verify real-time updates in both the Clinic Desk and Patient Mobile View, test "Self Check-In", and test "Emergency Triage".
