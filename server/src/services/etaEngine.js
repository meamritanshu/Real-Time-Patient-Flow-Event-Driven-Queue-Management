/**
 * Dynamic ETA Engine using Weighted Moving Average (WMA)
 */

/**
 * Calculate Weighted Moving Average (WMA) for consultation durations.
 * Specified weights: [0.1, 0.2, 0.3, 0.4] for the last 4 consultations.
 * @param {Array<number>} durations - Rolling window array of recent consultation durations in minutes (max 5)
 * @returns {number} WMA in minutes (rounded to 1 decimal place, minimum 1 min)
 */
export const calculateWMA = (durations) => {
  if (!durations || durations.length === 0) {
    return 10.0; // Default baseline 10 minutes
  }

  // Take the last 4 consultations (most recent last)
  const recent4 = durations.slice(-4);
  const targetWeights = [0.1, 0.2, 0.3, 0.4];

  if (recent4.length === 4) {
    let wma = 0;
    for (let i = 0; i < 4; i++) {
      wma += recent4[i] * targetWeights[i];
    }
    return Math.max(1.0, Math.round(wma * 10) / 10);
  }

  // If fewer than 4 items, normalize weights across available entries
  const availableCount = recent4.length;
  const rawWeights = targetWeights.slice(-availableCount);
  const sumWeights = rawWeights.reduce((acc, curr) => acc + curr, 0);

  let wma = 0;
  for (let i = 0; i < availableCount; i++) {
    const normalizedWeight = rawWeights[i] / sumWeights;
    wma += recent4[i] * normalizedWeight;
  }

  return Math.max(1.0, Math.round(wma * 10) / 10);
};

/**
 * Compute Dynamic ETA and tokens ahead for a given token or all tokens in queue.
 * @param {Object} params
 * @param {Array<Object>} params.waitingTokens - Sorted list of waiting/checked-in/emergency tokens
 * @param {Object|null} params.currentlyServing - Currently serving token object (if any)
 * @param {number} params.wma - Weighted Moving Average duration in minutes
 * @param {string} params.queueStatus - 'ACTIVE' or 'PAUSED'
 * @returns {Array<Object>} Tokens with calculated estimatedWaitMinutes, tokensAhead, and projectedTime
 */
export const calculateQueueETAs = ({ waitingTokens, currentlyServing, wma, queueStatus }) => {
  let activeRemainingTime = 0;

  if (currentlyServing && currentlyServing.consultationStartTime) {
    const elapsedMs = Date.now() - new Date(currentlyServing.consultationStartTime).getTime();
    const elapsedMinutes = elapsedMs / (1000 * 60);
    activeRemainingTime = Math.max(0, wma - elapsedMinutes);
  }

  return waitingTokens.map((token, index) => {
    // Tokens ahead = position in line (0-indexed index in sorted waiting list)
    const tokensAhead = index;
    
    // Dynamic ETA for Token K = (Tokens ahead) * WMA + (Remaining time of current active consultation)
    let estimatedWaitMinutes = (tokensAhead * wma) + activeRemainingTime;
    estimatedWaitMinutes = Math.round(estimatedWaitMinutes * 10) / 10;

    const projectedTime = new Date(Date.now() + estimatedWaitMinutes * 60 * 1000);

    return {
      ...token.toObject ? token.toObject() : token,
      tokensAhead,
      estimatedWaitMinutes,
      projectedTime: projectedTime.toISOString(),
      isQueuePaused: queueStatus === 'PAUSED',
    };
  });
};
