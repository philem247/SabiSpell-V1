import { AppConfig } from '../constants/AppConfig';

export interface RewardResult {
  xp: number;
  coins: number;
}

/**
 * Calculates XP and Coin rewards earned from spelling a word.
 *
 * Rules (PRD §5.3):
 * - If incorrect: 0 XP and 0 Coins.
 * - If correct:
 *   - base_coins = 5 + Math.floor(wordSSR / 200)
 *   - base_xp = base_coins * 2
 *   - Multipliers:
 *     - Streak: 1.1x (streak >= 3), 1.25x (streak >= 5), 1.5x (streak >= 10)
 *     - Daily Challenge: 1.5x
 *     - Cap: 2.5x total combined multiplier
 *   - Rewards are rounded to the nearest integer.
 */
export function calculateReward(
  wordSSR: number,
  isCorrect: boolean,
  currentStreak: number,
  isDailyChallenge: boolean = false
): RewardResult {
  if (!isCorrect) {
    return { xp: 0, coins: 0 };
  }

  // 1. Calculate base rewards
  const baseCoins = 5 + Math.floor(wordSSR / 200);
  const baseXP = baseCoins * 2;

  // 2. Determine streak multiplier
  let streakMultiplier = 1.0;
  // Sort descending by minStreak to find the highest threshold reached
  const sortedStreakThresholds = [...AppConfig.STREAK_MULTIPLIERS].sort(
    (a, b) => b.minStreak - a.minStreak
  );
  const activeStreakRule = sortedStreakThresholds.find(
    (rule) => currentStreak >= rule.minStreak
  );
  if (activeStreakRule) {
    streakMultiplier = activeStreakRule.multiplier;
  }

  // 3. Determine daily challenge multiplier
  const dailyChallengeMultiplier = isDailyChallenge
    ? AppConfig.DAILY_CHALLENGE_MULTIPLIER
    : 1.0;

  // 4. Combine and clamp multiplier
  let totalMultiplier = streakMultiplier * dailyChallengeMultiplier;
  if (totalMultiplier > AppConfig.REWARD_MULTIPLIER_CAP) {
    totalMultiplier = AppConfig.REWARD_MULTIPLIER_CAP;
  }

  // 5. Compute final rewards rounded to nearest integer
  const coins = Math.round(baseCoins * totalMultiplier);
  const xp = Math.round(baseXP * totalMultiplier);

  return { xp, coins };
}
