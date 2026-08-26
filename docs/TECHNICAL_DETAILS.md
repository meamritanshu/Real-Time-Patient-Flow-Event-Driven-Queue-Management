# Technical Details & System Architecture: MediQ

## 📐 System Architecture

MediQ is built as a high-concurrency, event-driven distributed system designed for sub-millisecond queue state retrieval and real-time WebSocket synchronization across hundreds of concurrent clinic clients.

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 React Dual Frontend                    │
                  │   (Clinic Control Desk  |  Patient Mobile View)       │
                  └───────────┬────────────────────────────────┬───────────┘
                              │ HTTP REST                      │ WebSockets (Socket.io)
                              ▼                                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Express.js Node Backend                                  │
│                                                                                          │
│   ┌────────────────────────┐    ┌────────────────────────┐    ┌──────────────────────┐   │
│   │   Queue Controllers    │    │   Dynamic ETA Engine   │    │  Socket.io Rooms     │   │
│   │  (Book/Checkin/Next)   │    │ (Weighted Moving Avg)  │    │  (room: doctorId)    │   │
│   └───────────┬────────────┘    └───────────┬────────────┘    └──────────┬───────────┘   │
└───────────────┼─────────────────────────────┼────────────────────────────┼───────────────┘
                │                             │                            │
                ▼                             ▼                            ▼
┌──────────────────────────────┐              │             ┌──────────────────────────────┐
│       MongoDB / Mongoose     │              └────────────►│         Redis Cache          │
│ (Atomic $inc Token Booking)  │                            │  (sub-ms queue snapshots)   │
└──────────────────────────────┘                            └──────────────────────────────┘
```

---

## 🗄️ Database Schemas (Mongoose)

### 1. `QueueState` Model (`server/src/models/QueueState.js`)
Stores the daily operational state for a specific doctor's queue.

```javascript
{
  clinicId: { type: String, required: true, index: true },
  doctorId: { type: String, required: true, index: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  currentServingToken: { type: Number, default: 0 },
  lastIssuedToken: { type: Number, default: 0 },
  status: { type: String, enum: ['ACTIVE', 'PAUSED'], default: 'ACTIVE' },
  recentConsultationDurations: { type: [Number], default: [10] } // Rolling window max 5
}
// Unique compound index: { doctorId: 1, date: 1 }
```

### 2. `Token` Model (`server/src/models/Token.js`)
Tracks individual patient token lifecycle, check-in status, priorities, and consultation timestamps.

```javascript
{
  tokenNumber: { type: Number, required: true },
  patientName: { type: String, required: true, trim: true },
  phoneNumber: { type: String, default: '' },
  doctorId: { type: String, required: true, index: true },
  status: { 
    type: String, 
    enum: ['BOOKED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED', 'EMERGENCY'],
    default: 'BOOKED',
    index: true 
  },
  bookingTime: { type: Date, default: Date.now },
  checkInTime: { type: Date },
  consultationStartTime: { type: Date },
  consultationEndTime: { type: Date },
  priorityScore: { type: Number, default: 0 } // Emergency triage = 100
}
// Indexes: { doctorId: 1, status: 1 }, { doctorId: 1, tokenNumber: 1 }
```

---

## ⚡ Concurrency-Safe Atomic Booking Algorithm

To guarantee **zero duplicate tokens or race conditions** during simultaneous booking requests, MediQ uses MongoDB's atomic `$inc` operator on `QueueState.lastIssuedToken`:

```javascript
const queueState = await QueueState.findOneAndUpdate(
  { doctorId, date },
  {
    $inc: { lastIssuedToken: 1 },
    $setOnInsert: {
      clinicId,
      currentServingToken: 0,
      status: 'ACTIVE',
      recentConsultationDurations: [10],
    },
  },
  { upsert: true, new: true }
);

const tokenNumber = queueState.lastIssuedToken;
```
Because `findOneAndUpdate` executes atomically at the document level inside MongoDB, concurrent threads will never receive the same `lastIssuedToken`.

---

## 🧮 Dynamic ETA Engine Math (Weighted Moving Average)

### 1. Weighted Moving Average (WMA)
When a consultation completes, the elapsed time in minutes ($\Delta t = \text{round}((\text{endTime} - \text{startTime})/60000)$) is pushed into `recentConsultationDurations` (max 5).

For the last 4 completed consultations $[d_1, d_2, d_3, d_4]$ (where $d_4$ is most recent):
$$WMA = 0.1 \times d_1 + 0.2 \times d_2 + 0.3 \times d_3 + 0.4 \times d_4$$

If fewer than 4 consultations exist in history, weights are normalized proportionally across available entries.

### 2. Dynamic Token ETA Formula
For Token $K$ at position $i$ in the active waiting queue (0-indexed):

$$\text{Tokens Ahead} = i$$

$$\text{Active Remaining Time} = \max\left(0, WMA - \frac{\text{Now} - \text{StartTime}_{\text{active}}}{60000}\right)$$

$$\text{Dynamic ETA (mins)} = (\text{Tokens Ahead} \times WMA) + \text{Active Remaining Time}$$

---

## 🚀 Redis Caching Layer

- Snapshots of doctor queue states are cached at key `queue:state:${doctorId}` with a TTL of 60 seconds.
- `GET /api/queue/state/:doctorId` reads from Redis cache first, returning sub-millisecond responses.
- Any mutation (`book`, `checkin`, `next`, `complete`, `skip`, `emergency`, `toggle-pause`) invalidates the Redis key and updates the snapshot.

---

## 📡 REST API Reference

| Endpoint | Method | Payload / Params | Description |
|---|---|---|---|
| `/api/queue/state/:doctorId` | GET | `doctorId` | Fetches full queue snapshot with ETAs |
| `/api/queue/book` | POST | `{ doctorId, patientName, phoneNumber, clinicId }` | Atomically books a new token |
| `/api/queue/checkin` | POST | `{ doctorId, tokenNumber, tokenId }` | Confirms patient arrival check-in |
| `/api/queue/next` | POST | `{ doctorId }` | Doctor calls the next patient in priority order |
| `/api/queue/complete` | POST | `{ doctorId }` | Completes consultation & updates WMA |
| `/api/queue/skip` | POST | `{ doctorId, tokenNumber }` | Moves absent patient to skipped buffer |
| `/api/queue/emergency` | POST | `{ doctorId, patientName, phoneNumber }` | Inserts urgent patient with Priority Score 100 |
| `/api/queue/toggle-pause` | POST | `{ doctorId }` | Toggles queue between `ACTIVE` and `PAUSED` |

---

## 🔌 Socket.io Event Layer

### Rooms
Clients emit `join_doctor_room(doctorId)` to subscribe to updates for a specific doctor room.

### Emitted Broadcasts
- `queue:state_updated`: Broadcasts fresh queue snapshot to all room members upon any mutation.
- `queue:next_called`: Emits payload with token details when doctor calls next patient.
- `queue:emergency_alert`: Emits urgent toast alert when an emergency triage patient is inserted.
- `queue:eta_updated`: Emits updated ETAs for active waiting tokens.

---

## 🛡️ Database Fallback Architecture

To ensure the codebase runs seamlessly in any environment:
- **MongoDB**: Connects to `process.env.MONGODB_URI` (`mongodb://127.0.0.1:27017/mediq`). If unreachable, transparently initializes `mongodb-memory-server`.
- **Redis**: Connects to `process.env.REDIS_URL` (`redis://127.0.0.1:6379`). If unreachable, transparently falls back to `ioredis-mock`.
