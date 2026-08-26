# Project Details: Real-Time Patient Flow and Event-Driven Queue Management (MediQ)

## 📌 Problem Statement & Clinical Context

In high-volume hospital Outpatient Departments (OPD) and clinics, traditional queue systems rely on static token numbering or rigid physical token dispensers. This creates several critical operational inefficiencies:

1. **Unpredictable Wait Times**: Static estimate algorithms assume fixed consultation durations (e.g. 10 mins per patient), ignoring real-time variation where some consultations take 4 minutes while complex diagnostic cases take 25 minutes.
2. **Crowded Waiting Rooms**: Without accurate real-time ETAs on their mobile devices, patients are forced to sit in congested hospital waiting areas, increasing cross-infection risks and anxiety.
3. **Absence & Disruption**: When called patients are absent or stepped away, clinic flow stalls as receptionists search for missing patients.
4. **Emergency Triage Inflexibility**: Urgent triage patients cannot be prioritized smoothly without destroying the sequential token order for remaining waiting patients.

---

## 🎯 Core Objectives & Solutions

MediQ addresses these challenges through an event-driven, high-concurrency distributed architecture:

### 1. Dynamic ETA Engine (Weighted Moving Average)
- Moves beyond fixed estimates by calculating a **Weighted Moving Average (WMA)** of the doctor's recent consultation durations ($WMA = \sum w_i d_i$, where $w = [0.1, 0.2, 0.3, 0.4]$ for the last 4 consultations).
- Computes dynamic live ETAs for every waiting patient based on their position in line, current active consultation elapsed time, and weighted doctor velocity.

### 2. Event-Driven Real-Time Synchronization
- Every state change (booking, check-in, doctor calling next, consultation complete, emergency insertion, queue pause) triggers immediate Socket.io room broadcasts (`queue:state_updated`, `queue:next_called`, `queue:emergency_alert`).
- Patients and clinic staff see sub-second updates without needing to refresh their screens.

### 3. Concurrency-Safe Atomic Token Booking
- Uses MongoDB atomic `$inc` on `QueueState.lastIssuedToken` (`findOneAndUpdate` with `{ upsert: true, new: true }`).
- Guarantees zero duplicate tokens or race conditions, even during simultaneous booking requests from hundreds of mobile devices.

### 4. Interactive Dual Interface
- **Clinic Control Desk**: Provides doctors and receptionists with a live ticking stopwatch, one-click action controls (Call Next, Complete, Skip, Pause, Emergency Triage), and a skipped patient recall buffer.
- **Patient Mobile View**: Provides patients with a personal smartphone card displaying their token, live "Now Serving" counter, visual "X Patients Ahead" count, live ETA countdown, and one-click self check-in.

---

## 🏥 User Roles & Workflows

### Doctor & Receptionist Workflow
1. Doctor logs into the **Clinic Control Desk**.
2. Queue status is set to `ACTIVE`.
3. Doctor clicks **"Call Next Patient"**. The next eligible patient (Emergency triage first, followed by Checked-In / Booked tokens) is moved to `IN_CONSULTATION`.
4. A live ticking stopwatch tracks consultation duration.
5. When finished, doctor clicks **"Complete Consultation"**. The system records exact duration, updates the rolling WMA window, recalculates ETAs for all waiting patients, and broadcasts updates live.
6. If an urgent patient arrives, doctor/receptionist clicks **"Emergency Triage"** to insert them immediately behind the active consultation with top priority.

### Patient Workflow
1. Patient books a token via OPD form or views an existing token on **Patient Mobile View**.
2. Displays **"Your Token: #15"**, **"Now Serving: #12"**, and **"3 Patients Ahead"**.
3. Shows dynamic live wait time: **"Estimated Wait: ~18 mins"**.
4. When patient arrives at clinic, they click **"Self Check-In"** to confirm arrival timestamp.
5. When doctor calls their token, the patient receives a live alert notification: *"It's Your Turn! Please enter Room 3"*.
