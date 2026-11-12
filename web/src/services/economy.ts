import { Config } from '../config';

export interface RewardResult {
  xp: number;
  coins: number;
}

export function calculateReward(
  wordSSR: number,
  isCorrect: boolean,
  currentStreak: number,
  isDailyChallenge = false,
): RewardResult {
  if (!isCorrect) return { xp: 0, coins: 0 };

  const baseCoins = 5 + Math.floor(wordSSR / 200);
  const baseXP = baseCoins * 2;
  const streak =
    Config.STREAK_MULTIPLIERS.find((s) => currentStreak >= s.minStreak)?.multiplier ?? 1;
  const multiplier = Math.min(
    Config.REWARD_MULTIPLIER_CAP,
    streak * (isDailyChallenge ? Config.DAILY_CHALLENGE_MULTIPLIER : 1),
  );

  return { xp: Math.round(baseXP * multiplier), coins: Math.round(baseCoins * multiplier) };
}
