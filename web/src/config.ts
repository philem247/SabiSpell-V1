export const Config = {
  SSR_MIN: 100,
  SSR_MAX: 2000,
  SSR_START: 1100,
  SSR_WORD_PROXIMITY: 300,
  SSR_WORD_PROXIMITY_WIDE: 500,
  SSR_CORRECT_MULTIPLIER: 1.2,
  SSR_INCORRECT_MULTIPLIER: 0.5,

  PLACEMENT_WORDS: 8,
  PLACEMENT_K_FACTOR: 40,

  WORDS_PER_ROUND: 5,
  TIME_PER_WORD_SEC: 45,
  HINT_COST_COINS: 10,
  STARTER_COINS: 150,

  ENERGY_CAP: 5,
  ENERGY_REFILL_INTERVAL_MS: 15 * 60 * 1000,

  GRADUATION_WORD_THRESHOLD: 50,
  GRADUATION_PASS_PERCENT: 0.75,
  GRADUATION_EXAM_WORDS: 20,
  GRADUATION_XP_BONUS: 1000,
  GRADUATION_COIN_BONUS: 400,

  XP_TITLES: [
    { name: 'Recruit', minXP: 0 },
    { name: 'Cadet', minXP: 2500 },
    { name: 'Scholar', minXP: 8000 },
    { name: 'Word Sage', minXP: 20000 },
    { name: "VC's List", minXP: 40000 },
  ],

  // Highest threshold first: the first match wins.
  STREAK_MULTIPLIERS: [
    { minStreak: 10, multiplier: 1.5 },
    { minStreak: 5, multiplier: 1.25 },
    { minStreak: 3, multiplier: 1.1 },
  ],
  DAILY_CHALLENGE_MULTIPLIER: 1.5,
  REWARD_MULTIPLIER_CAP: 2.5,

  STORAGE_KEYS: { PROFILE: 'sabispell:profile' },
} as const;
