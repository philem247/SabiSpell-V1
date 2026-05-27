import { AppConfig } from '../constants/AppConfig';

/**
 * Calculates the change in player rating (SSR) based on a single word trial.
 *
 * ELO Expected Score:
 * S_expected = 1 / (1 + 10^((wordSSR - playerSSR) / 400))
 *
 * Delta Calculation:
 * M_delta = K * (S_actual - S_expected) * multiplier
 * where:
 *   - K is K-factor (24 for SSS, 32 for Wazobia/Yoruba)
 *   - S_actual is 1.0 for correct, 0.0 for wrong
 *   - multiplier is SSR_CORRECT_MULTIPLIER (1.2) for correct, SSR_INCORRECT_MULTIPLIER (0.5) for wrong
 *
 * The return value is the delta rounded to the nearest integer.
 * The new rating is clamped between SSR_MIN (100) and SSR_MAX (2000).
 *
 * Inline unit test verification targets:
 *   - player=1100, word=1220, correct -> expected delta ≈ +19
 *   - player=1100, word=980, wrong -> expected delta ≈ -8
 */
export function calculateSSRDelta(
  playerSSR: number,
  wordSSR: number,
  isCorrect: boolean,
  isWazobia: boolean = false
): number {
  const kFactor = isWazobia ? AppConfig.SSR_K_FACTOR_WAZOBIA : AppConfig.SSR_K_FACTOR_SSS;

  // S_expected = 1 / (1 + 10^((wordSSR - playerSSR) / 400))
  const expectedScore = 1 / (1 + Math.pow(10, (wordSSR - playerSSR) / 400));
  const actualScore = isCorrect ? 1.0 : 0.0;

  // Multiplier: 1.2 for correct, 0.5 for incorrect to match PRD tests
  const multiplier = isCorrect
    ? AppConfig.SSR_CORRECT_MULTIPLIER
    : AppConfig.SSR_INCORRECT_MULTIPLIER;

  const rawDelta = kFactor * (actualScore - expectedScore) * multiplier;

  // Round to the nearest integer
  const roundedDelta = Math.round(rawDelta);

  // Clamp the resulting rating between min (100) and max (2000)
  const targetNewSSR = playerSSR + roundedDelta;
  const clampedNewSSR = Math.max(AppConfig.SSR_MIN, Math.min(AppConfig.SSR_MAX, targetNewSSR));

  // Return the final delta
  return clampedNewSSR - playerSSR;
}
