import cron from 'node-cron';
import { QueueState } from '../models/QueueState.js';
import { Token } from '../models/Token.js';
import { getRedisClient } from '../config/redis.js';

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayDateRange = () => {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return { $gte: start, $lte: end };
};

const getTomorrowDateString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const startQueueRolloverCron = () => {
  // Run daily at 23:59:59
  cron.schedule('59 59 23 * * *', async () => {
    console.log('[CRON] Starting midnight queue state rollover...');
    try {
      const date = getTodayDateString();
      const tomorrow = getTomorrowDateString();
      const dateQuery = { bookingTime: getTodayDateRange() };

      // Mark all pending tokens for today as 'SKIPPED'
      const pendingTokens = await Token.find({
        status: { $in: ['BOOKED', 'CHECKED_IN', 'EMERGENCY'] },
        ...dateQuery
      });

      for (const token of pendingTokens) {
        token.status = 'SKIPPED';
        await token.save();
      }

      console.log(`[CRON] Rolled over ${pendingTokens.length} tokens to SKIPPED.`);

      // Find all doctors that were active today to set them up for tomorrow
      const activeStates = await QueueState.find({ date });
      for (const state of activeStates) {
        await QueueState.create({
          clinicId: state.clinicId,
          doctorId: state.doctorId,
          date: tomorrow,
          currentServingToken: 0,
          lastIssuedToken: 0,
          status: 'ACTIVE',
          recentConsultationDurations: [10],
        });

        // Clear redis cache
        const redis = getRedisClient();
        if (redis) {
          try {
            await redis.del(`queue:state:${state.doctorId}`);
          } catch (err) {
            console.warn(`[CRON] Redis invalidate failed for doctor ${state.doctorId}:`, err.message);
          }
        }
      }

      console.log(`[CRON] Successfully pre-initialized ${activeStates.length} doctors for tomorrow.`);
    } catch (error) {
      console.error('[CRON] Queue state rollover failed:', error.message);
    }
  });
};
