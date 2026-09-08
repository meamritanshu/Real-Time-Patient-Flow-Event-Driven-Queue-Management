import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { QueueState } from './src/models/QueueState.js';
import { Token } from './src/models/Token.js';
import { getQueueSnapshot, checkInToken } from './src/services/queueService.js';
import { initRedisWithFallback, getRedisClient } from './src/config/redis.js';

async function run() {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await initRedisWithFallback();

  // ensure redis is clean
  const redis = getRedisClient();
  await redis.flushall();

  const doctorId = 'dr_test';

  // Create a token from yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const pastToken = await Token.create({
    tokenNumber: 1,
    patientName: 'Past Patient',
    doctorId,
    status: 'BOOKED',
    bookingTime: yesterday
  });

  try {
      await checkInToken({ doctorId, tokenNumber: 1, tokenId: pastToken._id.toString() });
      console.error('FAILURE: checkInToken succeeded for a token from yesterday.');
      process.exit(1);
  } catch (error) {
      if (error.message === 'Token not found') {
        console.log('SUCCESS: checkInToken rejected attempt to check in a token from yesterday.');
        process.exit(0);
      } else {
        console.error('FAILURE: Unexpected error:', error);
        process.exit(1);
      }
  }
}

run();
