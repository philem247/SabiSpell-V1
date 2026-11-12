import { Config } from '../config';

export function clampSSR(value: number): number {
  return Math.min(Config.SSR_MAX, Math.max(Config.SSR_MIN, value));
}

export function calculateSSRDelta(
  playerSSR: number,
  wordSSR: number,
  isCorrect: boolean,
  kFactor: number,
): number {
  const expected = 1 / (1 + 10 ** ((wordSSR - playerSSR) / 400));
  const actual = isCorrect ? 1 : 0;
  const multiplier = isCorrect ? Config.SSR_CORRECT_MULTIPLIER : Config.SSR_INCORRECT_MULTIPLIER;
  const raw = Math.round(kFactor * (actual - expected) * multiplier);
  return clampSSR(playerSSR + raw) - playerSSR;
}
