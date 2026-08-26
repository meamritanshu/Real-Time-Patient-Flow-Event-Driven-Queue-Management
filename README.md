# MediQ: Real-Time Patient Flow & Event-Driven Queue Management System

MediQ is a high-concurrency, event-driven queue management system designed for modern healthcare clinics and hospital Outpatient Departments (OPD). It eliminates crowded waiting rooms and unpredictable wait times through **concurrency-safe atomic token booking**, a **Weighted Moving Average (WMA) dynamic ETA engine**, **sub-millisecond Redis caching**, and **real-time WebSocket synchronization**.

---

## 📚 Technical Documentation Index

Detailed technical documentations are available in the [`docs/`](./docs) folder:

- 📌 [**Project Details & Domain Context**](./docs/PROJECT_DETAILS.md): Problem statement, OPD queue challenges, core objectives, and user workflows.
- 📐 [**Technical Specifications & System Architecture**](./docs/TECHNICAL_DETAILS.md): Database schemas, atomic `$inc` concurrency algorithms, WMA math breakdown, Redis caching strategy, REST endpoints, and Socket.io events.
- 💻 [**Technology Stack & Layout**](./docs/TECH_STACK.md): Full breakdown of backend, frontend, database, fallback engines, and monorepo structure.
- 🚀 [**Completed Accomplishments & Roadmap**](./docs/COMPLETED_AND_ROADMAP.md): Detailed summary of completed MVP features (Phase 1) and future roadmap (Phase 2 & 3).

---

## ✨ Key Features

- **⚡ Concurrency-Safe Atomic Token Booking**: Uses MongoDB `$inc` atomic updates on `QueueState.lastIssuedToken` to guarantee zero duplicate tokens or race conditions under high concurrent traffic.
- **⏱️ Dynamic WMA ETA Engine**: Calculates dynamic wait times using a rolling Weighted Moving Average ($w = [0.1, 0.2, 0.3, 0.4]$) of a doctor's recent consultation durations.
- **🚀 Sub-Millisecond Redis Caching**: Fast queue state snapshots cached at `queue:state:${doctorId}` with instant invalidation on state mutations.
- **📡 Sub-Second Socket.io Broadcasts**: Real-time room broadcasts (`queue:state_updated`, `queue:next_called`, `queue:emergency_alert`) keep patients and clinic staff synchronized without screen refreshes.
- **👨‍⚕️ Clinic Control Desk**: Doctor/receptionist interface featuring an active consultation hero card, live ticking stopwatch (`mm:ss`), one-click action controls (Call Next, Complete, Skip, Pause/Resume, Emergency Triage), and skipped patient recall buffer.
- **📱 Patient Mobile View**: Smartphone view featuring token cards, live "Now Serving" counter, "X Patients Ahead" count, live WMA wait time counter, and self check-in button.
- **⚡ Side-by-Side Dual View**: Dual-column layout demonstrating live real-time WebSocket synchronization in a single browser window.
- **🛡️ Zero-Friction Fallback**: Automatic in-memory fallback to `mongodb-memory-server` and `ioredis-mock` if native MongoDB/Redis instances are offline.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, Socket.io, Mongoose (MongoDB), ioredis (Redis), MongoMemoryServer, ioredis-mock.
- **Frontend**: Vite, React 18, Tailwind CSS, Lucide React, socket.io-client.
- **Databases**: MongoDB Community (v8.3), Redis Server (v8.10).

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ or v25+)
- npm (v9+)
- *(Optional)* Homebrew for native MongoDB & Redis daemons

### 1. Installation
Clone the repository and install all monorepo dependencies:

```bash
git clone https://github.com/meamritanshu/Real-Time-Patient-Flow-Event-Driven-Queue-Management.git
cd Real-Time-Patient-Flow-Event-Driven-Queue-Management
npm run install:all
```

### 2. Start Databases (Optional Native Services)
MediQ includes automatic in-memory fallbacks, but if you want native database services:

```bash
brew services start mongodb/brew/mongodb-community
brew services start redis
```

### 3. Seed Default Mock Data
Seed default mock data for `dr_sharma_01` (Dr. Ananya Sharma, Cardiology):

```bash
npm run seed
```

### 4. Launch Development Servers
Launch both Express backend server (Port 5001) and Vite React client (Port 5173) concurrently:

```bash
npm run dev
```

Open your browser and visit:
- **Application URL**: `http://localhost:5173`
- **Backend Health Check**: `http://localhost:5001/health`

---

## 🔌 API & Event Overview

### REST Endpoints (`/api/queue`)
- `GET /state/:doctorId` - Fetch queue snapshot with dynamic ETAs
- `POST /book` - Atomically book a new token
- `POST /checkin` - Confirm patient arrival check-in
- `POST /next` - Call next patient in priority order
- `POST /complete` - Complete consultation & update WMA duration
- `POST /skip` - Move absent patient to skipped buffer
- `POST /emergency` - Insert urgent triage patient (Priority Score 100)
- `POST /toggle-pause` - Toggle queue between ACTIVE and PAUSED

---

## 📜 License

MIT License. Designed and engineered for high-concurrency healthcare queue management.
