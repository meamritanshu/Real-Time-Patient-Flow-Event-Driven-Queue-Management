import { QueueState } from '../models/QueueState.js';
import { Token } from '../models/Token.js';
import { calculateWMA, calculateQueueETAs } from './etaEngine.js';
import { getRedisClient } from '../config/redis.js';

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayDateBoundaries = () => {
  const date = getTodayDateString();
  const [year, month, day] = date.split('-');
  return {
    date,
    startOfDay: new Date(year, month - 1, day, 0, 0, 0, 0),
    endOfDay: new Date(year, month - 1, day, 23, 59, 59, 999),
  };
};

export const getQueueSnapshot = async (doctorId) => {
  const redis = getRedisClient();
  const cacheKey = `queue:state:${doctorId}`;

  // Try fetching from Redis cache first
  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  } catch (err) {
    console.warn('Redis read failed, proceeding with DB lookup:', err.message);
  }

  const { date, startOfDay, endOfDay } = getTodayDateBoundaries();

  let queueState = await QueueState.findOne({ doctorId, date });

  if (!queueState) {
    queueState = await QueueState.create({
      clinicId: 'apollo_main_01',
      doctorId,
      date,
      currentServingToken: 0,
      lastIssuedToken: 0,
      status: 'ACTIVE',
      recentConsultationDurations: [10],
    });
  }

  // Fetch currently serving token for today
  const currentlyServing = await Token.findOne({
    doctorId,
    status: 'IN_CONSULTATION',
    bookingTime: { $gte: startOfDay, $lte: endOfDay },
  }).sort({ updatedAt: -1 });

  // Fetch waiting / active tokens (EMERGENCY, CHECKED_IN, BOOKED) for today
  const waitingTokens = await Token.find({
    doctorId,
    status: { $in: ['EMERGENCY', 'CHECKED_IN', 'BOOKED'] },
    bookingTime: { $gte: startOfDay, $lte: endOfDay },
  }).sort({
    priorityScore: -1,   // Emergency triage (100) first
    tokenNumber: 1,      // Sequential token order
  });

  // Fetch completed tokens for today
  const completedTokens = await Token.find({
    doctorId,
    status: 'COMPLETED',
    bookingTime: { $gte: startOfDay, $lte: endOfDay },
  }).sort({ consultationEndTime: -1 });

  // Fetch skipped tokens for today
  const skippedTokens = await Token.find({
    doctorId,
    status: 'SKIPPED',
    bookingTime: { $gte: startOfDay, $lte: endOfDay },
  }).sort({ updatedAt: -1 });

  const wma = calculateWMA(queueState.recentConsultationDurations);

  const waitingWithEtas = calculateQueueETAs({
    waitingTokens,
    currentlyServing,
    wma,
    queueStatus: queueState.status,
  });

  const snapshot = {
    doctorId,
    clinicId: queueState.clinicId,
    date: queueState.date,
    status: queueState.status,
    currentServingToken: queueState.currentServingToken,
    lastIssuedToken: queueState.lastIssuedToken,
    recentConsultationDurations: queueState.recentConsultationDurations,
    wmaMinutes: wma,
    currentlyServing: currentlyServing
      ? {
          ...currentlyServing.toObject(),
          elapsedMinutes: currentlyServing.consultationStartTime
            ? Math.max(0, Math.round((Date.now() - new Date(currentlyServing.consultationStartTime).getTime()) / 60000 * 10) / 10)
            : 0,
        }
      : null,
    waitingQueue: waitingWithEtas,
    completedCount: completedTokens.length,
    completedTokens,
    skippedTokens,
    updatedAt: new Date().toISOString(),
  };

  // Cache snapshot in Redis with a 60-second TTL
  try {
    await redis.set(cacheKey, JSON.stringify(snapshot), 'EX', 60);
  } catch (err) {
    console.warn('Redis write failed:', err.message);
  }

  return snapshot;
};

export const invalidateRedisCache = async (doctorId) => {
  try {
    const redis = getRedisClient();
    await redis.del(`queue:state:${doctorId}`);
  } catch (err) {
    console.warn('Redis invalidate failed:', err.message);
  }
};

/**
 * Concurrency-Safe Atomic Token Booking using MongoDB $inc
 */
export const bookToken = async ({ clinicId = 'apollo_main_01', doctorId, patientName, phoneNumber, isEmergency = false }) => {
  const date = getTodayDateString();

  // Atomic update to guarantee zero duplicate token numbers during simultaneous requests
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
  const status = isEmergency ? 'EMERGENCY' : 'BOOKED';
  const priorityScore = isEmergency ? 100 : 0;

  const newToken = await Token.create({
    tokenNumber,
    patientName,
    phoneNumber: phoneNumber || '',
    doctorId,
    status,
    priorityScore,
    bookingTime: new Date(),
  });

  await invalidateRedisCache(doctorId);
  return { newToken, queueState };
};

export const checkInToken = async ({ doctorId, tokenNumber, tokenId }) => {
  const { startOfDay, endOfDay } = getTodayDateBoundaries();

  const query = tokenId
    ? { _id: tokenId, bookingTime: { $gte: startOfDay, $lte: endOfDay } }
    : { doctorId, tokenNumber: Number(tokenNumber), bookingTime: { $gte: startOfDay, $lte: endOfDay } };
  
  const token = await Token.findOne(query);
  if (!token) {
    throw new Error('Token not found');
  }

  if (token.status === 'COMPLETED') {
    throw new Error('Token consultation is already completed');
  }

  token.status = 'CHECKED_IN';
  token.checkInTime = new Date();
  await token.save();

  await invalidateRedisCache(doctorId);
  return token;
};

export const callNextPatient = async (doctorId) => {
  const { date, startOfDay, endOfDay } = getTodayDateBoundaries();

  let queueState = await QueueState.findOne({ doctorId, date });

  if (!queueState) {
    throw new Error('Queue state not initialized for doctor');
  }

  // Find next eligible patient (EMERGENCY first, then CHECKED_IN / BOOKED by tokenNumber) for today
  const nextToken = await Token.findOne({
    doctorId,
    status: { $in: ['EMERGENCY', 'CHECKED_IN', 'BOOKED'] },
    bookingTime: { $gte: startOfDay, $lte: endOfDay },
  }).sort({
    priorityScore: -1,
    tokenNumber: 1,
  });

  if (!nextToken) {
    return null; // No waiting patients
  }

  // If there was an active patient in consultation, mark them completed first
  const currentActive = await Token.findOne({
    doctorId,
    status: 'IN_CONSULTATION',
    bookingTime: { $gte: startOfDay, $lte: endOfDay }
  });
  if (currentActive) {
    const startTime = currentActive.consultationStartTime || currentActive.updatedAt;
    const elapsedMinutes = Math.max(1, Math.round((Date.now() - new Date(startTime).getTime()) / (1000 * 60)));
    currentActive.status = 'COMPLETED';
    currentActive.consultationEndTime = new Date();
    await currentActive.save();

    queueState.recentConsultationDurations.push(elapsedMinutes);
    if (queueState.recentConsultationDurations.length > 5) {
      queueState.recentConsultationDurations = queueState.recentConsultationDurations.slice(-5);
    }
  }

  // Update next token to IN_CONSULTATION
  nextToken.status = 'IN_CONSULTATION';
  nextToken.consultationStartTime = new Date();
  await nextToken.save();

  queueState.currentServingToken = nextToken.tokenNumber;
  await queueState.save();

  await invalidateRedisCache(doctorId);
  return nextToken;
};

export const completeConsultation = async (doctorId) => {
  const { date, startOfDay, endOfDay } = getTodayDateBoundaries();

  const activeToken = await Token.findOne({
    doctorId,
    status: 'IN_CONSULTATION',
    bookingTime: { $gte: startOfDay, $lte: endOfDay }
  });
  if (!activeToken) {
    throw new Error('No active consultation currently in progress');
  }

  const startTime = activeToken.consultationStartTime || new Date();
  const endTime = new Date();
  const elapsedMinutes = Math.max(1, Math.round((endTime.getTime() - new Date(startTime).getTime()) / (1000 * 60)));

  activeToken.status = 'COMPLETED';
  activeToken.consultationEndTime = endTime;
  await activeToken.save();

  const queueState = await QueueState.findOne({ doctorId, date });
  if (queueState) {
    queueState.recentConsultationDurations.push(elapsedMinutes);
    if (queueState.recentConsultationDurations.length > 5) {
      queueState.recentConsultationDurations = queueState.recentConsultationDurations.slice(-5);
    }
    await queueState.save();
  }

  await invalidateRedisCache(doctorId);
  return { completedToken: activeToken, durationMinutes: elapsedMinutes };
};

export const skipPatient = async (doctorId, tokenNumber) => {
  const { date, startOfDay, endOfDay } = getTodayDateBoundaries();

  const token = await Token.findOne({
    doctorId,
    bookingTime: { $gte: startOfDay, $lte: endOfDay },
    ...(tokenNumber ? { tokenNumber: Number(tokenNumber) } : { status: 'IN_CONSULTATION' }),
  });

  if (!token) {
    throw new Error('Target token not found to skip');
  }

  token.status = 'SKIPPED';
  await token.save();

  const queueState = await QueueState.findOne({ doctorId, date });
  if (queueState && queueState.currentServingToken === token.tokenNumber) {
    queueState.currentServingToken = 0;
    await queueState.save();
  }

  await invalidateRedisCache(doctorId);
  return token;
};

export const insertEmergencyPatient = async ({ doctorId, patientName, phoneNumber }) => {
  const { newToken } = await bookToken({
    doctorId,
    patientName,
    phoneNumber,
    isEmergency: true,
  });

  return newToken;
};

export const toggleQueuePause = async (doctorId) => {
  const date = getTodayDateString();
  let queueState = await QueueState.findOne({ doctorId, date });
  
  if (!queueState) {
    queueState = await QueueState.create({
      clinicId: 'apollo_main_01',
      doctorId,
      date,
      status: 'ACTIVE',
    });
  }

  queueState.status = queueState.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
  await queueState.save();

  await invalidateRedisCache(doctorId);
  return queueState;
};
