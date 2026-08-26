# Technology Stack & Environment: MediQ

MediQ is architected as a two-folder monorepo balancing simplicity, developer experience, and production readiness.

---

## 💻 Tech Stack Summary

```
========================================================================================
LAYER              TECHNOLOGY                      PURPOSE / FUNCTIONALITY
========================================================================================
Backend Runtime    Node.js (v25.6.1 / v18+)        Asynchronous non-blocking JavaScript engine
HTTP Framework     Express.js (v4.19)              REST API routing & middleware
Real-Time Engine   Socket.io (v4.7)                Bi-directional WebSockets event layer
Primary Database   MongoDB Community (v8.3)         Document database storing QueueState & Tokens
Object Modeling    Mongoose (v8.4)                 Schema validation & query interface
In-Memory DB       MongoMemoryServer (v9.2)        Zero-install embedded MongoDB fallback
Cache Layer        Redis (v8.10 via ioredis v5.4)  Sub-millisecond queue snapshot caching
In-Memory Cache    ioredis-mock (v8.9)             In-memory Redis command emulator fallback
----------------------------------------------------------------------------------------
Frontend Build     Vite (v5.2)                     Lightning-fast HMR bundler
UI Library         React (v18.3)                   Declarative UI component architecture
Styling Engine     Tailwind CSS (v3.4)             Utility-first styling with custom glassmorphism
Icon Set           Lucide React (v0.383)           Clinical vector iconography
Real-Time Client   socket.io-client (v4.7)         Websocket client with auto-reconnection
========================================================================================
```

---

## 📦 Monorepo Directory Layout

```
MediQ/
├── docs/                           # Technical documentation & project specifications
│   ├── PROJECT_DETAILS.md
│   ├── TECHNICAL_DETAILS.md
│   ├── TECH_STACK.md
│   └── COMPLETED_AND_ROADMAP.md
├── package.json                    # Root monorepo scripts (dev, seed, install:all)
├── server/                         # Express & Socket.io Backend Application
│   ├── package.json
│   ├── .env.example
│   ├── .env
│   └── src/
│       ├── server.js               # Entry point (Express, Socket.io, DB startup)
│       ├── config/
│       │   ├── db.js               # MongoDB connection with MongoMemoryServer fallback
│       │   └── redis.js            # Redis client with ioredis-mock fallback
│       ├── models/
│       │   ├── QueueState.js       # Doctor daily queue state Mongoose model
│       │   └── Token.js            # Patient token lifecycle Mongoose model
│       ├── services/
│       │   ├── etaEngine.js        # Dynamic WMA calculation engine
│       │   └── queueService.js     # Atomic booking & queue state transitions
│       ├── controllers/
│       │   └── queueController.js  # REST controllers & socket broadcast triggers
│       ├── routes/
│       │   └── queueRoutes.js      # REST endpoint definitions
│       ├── sockets/
│       │   └── queueSocket.js      # Socket.io room management handlers
│       └── seed.js                 # Default seed script for dr_sharma_01
└── client/                         # Vite + React Dual Frontend Application
    ├── package.json
    ├── vite.config.js              # Vite dev server & proxy settings (Port 5001)
    ├── tailwind.config.js          # Custom clinical color tokens & animations
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                 # View router (Desk, Patient, Side-by-Side Dual View)
        ├── index.css               # Tailwind directives & glassmorphism classes
        ├── context/
        │   └── SocketContext.jsx   # Real-time WebSocket provider & state sync
        ├── components/
        │   ├── Header.jsx          # Top navigation bar & socket pulse indicator
        │   ├── clinic/
        │   │   ├── ClinicDesk.jsx  # Doctor & receptionist control desk container
        │   │   ├── ActiveConsultationCard.jsx # Hero token & ticking stopwatch
        │   │   ├── ControlBar.jsx  # One-click doctor action controls
        │   │   ├── QueueTable.jsx  # Live queue table & skipped patient buffer
        │   │   └── EmergencyModal.jsx # Rapid triage patient insertion modal
        │   └── patient/
        │       ├── PatientMobileView.jsx # Smartphone preview frame
        │       ├── TokenCard.jsx   # Token hero card & patients ahead count
        │       ├── DynamicEtaDisplay.jsx # Live WMA ETA wait time counter
        │       └── BookingModal.jsx# OPD token booking simulation
        └── utils/
            └── formatters.js       # Time formatting & status badge styles
```

---

## 🛠️ Environment Configuration

### Backend Environment Variables (`server/.env`)

```ini
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/mediq
REDIS_URL=redis://127.0.0.1:6379
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```
