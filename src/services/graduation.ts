import { AppConfig, getGraduationThreshold } from '../constants/AppConfig';

export interface GraduationResult {
  passed: boolean;
  score: number;
  total: number;
  percentage: number;
  xpBonus: number;
  coinBonus: number;
}

/**
 * Returns true if the player has met the graduation unlock criteria.
 * Demo mode threshold: 5 words. Full product: 50 words.
 */
export function isGraduationUnlocked(wordHistorySss: string[]): boolean {
  return wordHistorySss.length >= getGraduationThreshold();
}

/**
 * Evaluates the result of a graduation exam.
 * Pass threshold: 75% (15/20 words correct by default).
 */
export function processGraduationResult(
  score: number,
  total: number = AppConfig.GRADUATION_EXAM_WORDS
): GraduationResult {
  const percentage = total > 0 ? score / total : 0;
  const passed = percentage >= AppConfig.GRADUATION_PASS_PERCENT;
  return {
    passed,
    score,
    total,
    percentage,
    xpBonus:   passed ? AppConfig.GRADUATION_XP_BONUS   : 0,
    coinBonus: passed ? AppConfig.GRADUATION_COIN_BONUS : 0,
  };
}

/** SSR range for graduation exam word selection (SSS 2). */
export const GRADUATION_SSR_MIN = 1200;
export const GRADUATION_SSR_MAX = 1499;

/** Formats a pass percentage for display, e.g. "87%". */
export function formatPassRate(percentage: number): string {
  return `${Math.round(percentage * 100)}%`;
}
