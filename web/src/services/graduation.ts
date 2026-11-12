import { Config } from '../config';

export interface GraduationResult {
  passed: boolean;
  score: number;
  total: number;
  percentage: number;
  xpBonus: number;
  coinBonus: number;
}

export function isGraduationUnlocked(collectionWordHistory: string[]): boolean {
  return collectionWordHistory.length >= Config.GRADUATION_WORD_THRESHOLD;
}

export function processGraduationResult(
  score: number,
  total: number = Config.GRADUATION_EXAM_WORDS,
): GraduationResult {
  const safeTotal = Math.max(0, total);
  const safeScore = Math.min(Math.max(score, 0), safeTotal);
  const percentage = safeTotal > 0 ? safeScore / safeTotal : 0;
  const passed = percentage >= Config.GRADUATION_PASS_PERCENT;
  return {
    passed,
    score: safeScore,
    total: safeTotal,
    percentage,
    xpBonus: passed ? Config.GRADUATION_XP_BONUS : 0,
    coinBonus: passed ? Config.GRADUATION_COIN_BONUS : 0,
  };
}

export function formatPassRate(percentage: number): string {
  return `${Math.round(percentage * 100)}%`;
}
