/**
 * SabiSpell Application Configuration
 *
 * Single source of truth for all runtime flags and tuning constants.
 * Change __DEMO_MODE__ to false for production builds.
 */

export const AppConfig = {
  // ── Demo mode ────────────────────────────────────────────────────────────────
  // When true:
  //  • Graduation threshold reduced from 50 → 5 words (judges can reach it fast)
  //  • Energy refill button shown in Settings
  //  • Leaderboard uses hardcoded seed data from DemoSeeds.ts
  //  • Daily Challenge always shown as active
  //  • DEMO_PROFILE pre-loaded as the default first-launch state
  __DEMO_MODE__: true as boolean,

  // ── App metadata ─────────────────────────────────────────────────────────────
  APP_NAME: 'SabiSpell',
  APP_VERSION: '0.1.0',
  BUILD_ENV: 'prototype' as 'prototype' | 'production',
  WORD_BANK_VERSION: '1.0.0',

  // ── SSR / ELO Engine ─────────────────────────────────────────────────────────
  // ELO formula: new_ssr = clamp(player_ssr + K × (S_actual − S_expected) × factor, SSR_MIN, SSR_MAX)
  SSR_K_FACTOR_SSS:    24,   // SSS tier K-factor (higher = faster rating change)
  SSR_K_FACTOR_WAZOBIA:32,   // Wazobia track adapts faster (harder to measure baseline)
  SSR_MIN:             100,
  SSR_MAX:             2000,
  SSR_SSS_DEFAULT:     1100, // Starting SSR for SSS 2 when the diagnostic is skipped
  SSR_WORD_PROXIMITY:  300,  // Only select words within ±300 SSR of the player

  // ── Game parameters ──────────────────────────────────────────────────────────
  WORDS_PER_ROUND:     5,
  TIME_PER_WORD_SEC:   45,
  HINT_COST_COINS:     10,
  STARTER_COINS:       150,  // Awarded automatically on onboarding completion

  // ── Energy ───────────────────────────────────────────────────────────────────
  ENERGY_CAP:                     5,              // Prototype cap (full PRD: 10)
  ENERGY_REFILL_INTERVAL_MS:      15 * 60 * 1000, // 1 energy pip every 15 minutes
  ENERGY_COST_ACADEMIC:           1,
  ENERGY_COST_WAZOBIA:            2,
  ENERGY_COST_ARENA:              2,

  // ── Graduation ───────────────────────────────────────────────────────────────
  GRADUATION_WORD_THRESHOLD_FULL: 50,  // Full product threshold
  GRADUATION_WORD_THRESHOLD_DEMO: 5,   // Demo mode — unlockable in one session
  GRADUATION_PASS_PERCENT:        0.75, // 75% = 15/20 words correct
  GRADUATION_EXAM_WORDS:          20,
  GRADUATION_XP_BONUS:            1000,
  GRADUATION_COIN_BONUS:          400,

  // ── XP Titles — SSS tier thresholds (ascending) ──────────────────────────────
  XP_TITLES: [
    { title: 'Recruit',   minXP: 0 },
    { title: 'Cadet',     minXP: 2500 },
    { title: 'Scholar',   minXP: 8000 },
    { title: 'Word Sage', minXP: 20000 },
    { title: "VC's List", minXP: 40000 },
  ] as const,

  // ── SabiBot Arena ────────────────────────────────────────────────────────────
  SABIBOT_CORRECT_PROBABILITY:  0.72,
  SABIBOT_ANSWER_DELAY_MIN_MS:  5000,  // 5 seconds minimum "thinking" time
  SABIBOT_ANSWER_DELAY_MAX_MS:  13000, // 13 seconds maximum

  // ── Reward multipliers ───────────────────────────────────────────────────────
  // Streak multipliers — applied on top of base reward when player has a streak
  STREAK_MULTIPLIERS: [
    { minStreak: 3,  multiplier: 1.1 },
    { minStreak: 5,  multiplier: 1.25 },
    { minStreak: 10, multiplier: 1.5 },
  ] as const,
  DAILY_CHALLENGE_MULTIPLIER: 1.5,
  REWARD_MULTIPLIER_CAP:      2.5,

  // ── Demo mode hidden controls ─────────────────────────────────────────────────
  // Tap the Àjàlá logo 5 times on the Dashboard to reveal the demo control panel.
  DEMO_UNLOCK_TAP_COUNT: 5,

  // ── AsyncStorage keys (namespaced to avoid clashes) ──────────────────────────
  STORAGE_KEYS: {
    PROFILE:        'sabispell:profile',
    HAS_ONBOARDED:  'sabispell:hasOnboarded',
    GAME_SESSION:   'sabispell:gameSession',
    WORD_HISTORY:   'sabispell:wordHistory',
    ENERGY_STATE:   'sabispell:energyState',
    LAST_ACTIVE:    'sabispell:lastActive',
    ARENA_SESSION:  'sabispell:arenaSession',
  } as const,
} as const;

// ─── Derived helper — resolve graduation threshold based on mode ──────────────
export function getGraduationThreshold(): number {
  return AppConfig.__DEMO_MODE__
    ? AppConfig.GRADUATION_WORD_THRESHOLD_DEMO
    : AppConfig.GRADUATION_WORD_THRESHOLD_FULL;
}

// ─── Derived helper — resolve XP title from total XP ─────────────────────────
export function getXPTitle(xp: number): string {
  const titles = [...AppConfig.XP_TITLES].reverse();
  return titles.find((t) => xp >= t.minXP)?.title ?? 'Recruit';
}

// ─── Derived helper — resolve next XP title threshold ────────────────────────
export function getNextTitleXP(xp: number): number | null {
  const next = AppConfig.XP_TITLES.find((t) => t.minXP > xp);
  return next?.minXP ?? null; // null means the player has reached the highest title
}
