import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { initRedisWithFallback } from './config/redis.js';
import queueRoutes from './routes/queueRoutes.js';
import { setupQueueSocket } from './sockets/queueSocket.js';
import { startQueueRolloverCron } from './cron/queueRollover.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for dev preview flexibility
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Attach io to app context for controllers
app.set('io', io);

// API Routes
app.use('/api/queue', queueRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'MediQ Server operational' });
});

// Setup Socket.io Handlers
setupQueueSocket(io);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await initRedisWithFallback();

  // Start automated cron jobs
  startQueueRolloverCron();

  server.listen(PORT, () => {
    console.log(`🚀 MediQ Server running on port ${PORT}`);
    console.log(`📡 Socket.io server ready for real-time events`);
  });
};

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
