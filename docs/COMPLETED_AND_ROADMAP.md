# Completed Features & Roadmap: MediQ

## ✅ Phase 1: Completed MVP Features

### 1. Database & Persistence Layer
- [x] **Mongoose Models**: Created `QueueState` (rolling duration window, compound index on `{ doctorId, date }`) and `Token` (token number, patient name, status, timestamps, priority score).
- [x] **Native Databases**: Installed and started native `mongodb-community` (port 27017) and `redis` (port 6379) via Homebrew services.
- [x] **Zero-Friction Fallback**: Implemented automatic fallback to `mongodb-memory-server` and `ioredis-mock` if native instances are offline.
- [x] **Default Mock Data**: Created seed script `npm run seed` for `dr_sharma_01` (Dr. Ananya Sharma, Cardiology) with active, checked-in, booked, and completed tokens.

### 2. Concurrency & Core Engine
- [x] **Concurrency-Safe Atomic Booking**: Implemented atomic `$inc` on `QueueState.lastIssuedToken` (`findOneAndUpdate` with `{ upsert: true, new: true }`) to eliminate duplicate tokens or race conditions under high concurrency.
- [x] **Dynamic WMA ETA Engine**: Calculated rolling Weighted Moving Average ($w = [0.1, 0.2, 0.3, 0.4]$) on recent consultation durations to project live patient wait times.
- [x] **Redis Snapshot Caching**: Cached fast queue snapshots at `queue:state:${doctorId}` with 60s TTL and automatic invalidation on mutations.

### 3. Real-Time WebSocket Layer
- [x] **Socket.io Room Subscriptions**: Organized sockets into rooms keyed by `doctorId` (`join_doctor_room`).
- [x] **Real-Time Broadcasts**: Implemented `queue:state_updated`, `queue:next_called`, `queue:emergency_alert`, and `queue:eta_updated`.

### 4. Interactive Dual-Interface Frontend
- [x] **Clinic Control Desk**:
  - Top doctor banner with active queue status badge (`ACTIVE` / `PAUSED`).
  - Active consultation hero card with live ticking stopwatch (`mm:ss`) and WMA duration.
  - Action control bar (Call Next, Complete, Skip, Pause/Resume, Emergency Triage).
  - Live waiting queue table with dynamic status pills.
  - Skipped patients buffer with one-click recall capability.
- [x] **Patient Mobile View**:
  - Smartphone preview frame.
  - Token card showing "Your Token: #15", "Now Serving: #12", and "X Patients Ahead".
  - Live Dynamic ETA Counter: "Estimated Wait: ~18 mins".
  - One-click Self Check-In button.
  - Live WebSocket connection status pill.
- [x] **Side-by-Side Dual View**: Dual column view displaying both interfaces side-by-side to watch live real-time WebSocket synchronization.

---

## 🚀 Phase 2: Near-Term Roadmap (What's Next)

### 📱 1. Automated SMS & WhatsApp Alerts (Twilio / Gupshup Integration)
- Send automated WhatsApp/SMS notifications to patients when their token is **3 patients away** ("Your turn is coming up in ~15 mins, please head to Room 3").
- Instant SMS alert when doctor calls their token.

### 📷 2. Physical QR Code Lounge Kiosk Check-In
- Generate printable QR codes for clinic waiting rooms.
- Scanning the QR code automatically triggers `POST /api/queue/checkin` via mobile browser without app installation.

### 📊 3. Receptionist Kiosk Mode & Voice Calling
- Full-screen TV display view for waiting rooms showing currently serving token numbers in large font.
- Web Speech API integration to audibly announce called tokens (*"Token 15, Rahul Verma, please proceed to Room 3"*).

---

## 🏢 Phase 3: Enterprise & Scale Roadmap

### 🏥 1. Multi-Tenant Hospital & Department Isolation
- Tenant isolation schema supporting multiple hospital branches, departments (Cardiology, Pediatrics, Orthopedics), and 100+ doctors simultaneously.

### 🧠 2. AI-Based Predictive Wait Time Engine
- Train Machine Learning models (TensorFlow.js / Scikit-Learn) on historical consultation data taking into account doctor specialty, day of week, patient age, and diagnostic complexity.

### 🔌 3. HL7 / FHIR EMR System Integration
- Bidirectional integration with hospital Electronic Medical Record (EMR) systems (Epic, Cerner, OpenMRS) to automatically sync patient appointments into the live queue.
