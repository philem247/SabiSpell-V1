/**
 * SabiSpell Demo Seeds
 *
 * Pre-loaded data used when AppConfig.__DEMO_MODE__ is true.
 *
 * The DEMO_PROFILE represents a compelling mid-progression state:
 *   - "Scholar" title (6,420 XP — midway between Scholar and Word Sage)
 *   - 12-day streak (shows sustained engagement)
 *   - 340 coins (enough to show economy without feeling maxed-out)
 *   - 8 energy (active, not depleted)
 *   - 5 words already in word_history (enough to unlock Graduation Exam in demo mode)
 *
 * Word IDs reference real entries in assets/wordbanks/sss_wordbank.json.
 */

import type { ThemeKey } from './Colors';

// ─────────────────────────────────────────────────────────────────────────────
// Shared player profile shape
// (profileStore.ts on Day 4 will import this type)
// ─────────────────────────────────────────────────────────────────────────────

export interface PlayerProfile {
  // Identity
  username: string;
  declaredClass: string;         // e.g. 'SSS 2'
  declaredTier: ThemeKey;        // maps to theme and wordbank tier
  hasOnboarded: boolean;

  // SSR ratings — one per track
  academic_ssr: number;
  wazobia_ssr: number;

  // Economy
  xp: number;
  coins: number;
  current_title: string;

  // Streak
  daily_streak: number;
  last_played_date: string;      // Stored as toDateString() for day comparison

  // Word history — tracks completed words to prevent re-use within a session
  // and to check graduation unlock threshold
  word_history: {
    sss: string[];               // Array of word IDs
    yoruba: string[];
  };
  wazobia_words_completed: {
    yo: number;                  // Yoruba words completed (for Wazobia SSR / progression)
  };

  // Energy
  energy: number;
  last_energy_refill_ts: number; // Date.now() timestamp for refill calculation

  // Progression
  isGraduated: boolean;
  graduation_date: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Demo Player Profile
// Values match §3 of the Hackathon PRD exactly.
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_PROFILE: PlayerProfile = {
  username:          'SpellChampion',
  declaredClass:     'SSS 2',
  declaredTier:      'sss',
  hasOnboarded:      true,

  academic_ssr:      1187,
  wazobia_ssr:       950,

  xp:                6420,
  coins:             340,
  current_title:     'Scholar',

  daily_streak:      12,
  last_played_date:  new Date().toDateString(),

  // sw_001 → sw_010 are real IDs from sss_wordbank.json.
  // These 5 entries satisfy the demo graduation threshold (AppConfig.GRADUATION_WORD_THRESHOLD_DEMO = 5).
  word_history: {
    sss:    ['sw_001', 'sw_002', 'sw_003', 'sw_007', 'sw_010'],
    yoruba: [],
  },
  wazobia_words_completed: { yo: 0 },

  energy:                 8,
  last_energy_refill_ts:  Date.now(),

  isGraduated:     false,
  graduation_date: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Leaderboard entry shape
// ─────────────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank:        number;
  username:    string;
  title:       string;
  xp:          number;
  isLiveUser?: boolean;  // true = the currently playing user (appended dynamically)
  hasPrize?:   boolean;  // true = top-3 MTN data prize badge shown
}

// ─────────────────────────────────────────────────────────────────────────────
// Hardcoded leaderboards (used when __DEMO_MODE__ is true)
// Values from §8 Week 3 Day 19 of the Hackathon PRD.
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_LEADERBOARD_SSS2: LeaderboardEntry[] = [
  { rank: 1, username: 'AbiodunSpell', title: 'Word Sage', xp: 19840, hasPrize: true  },
  { rank: 2, username: 'FatimaWords',  title: 'Word Sage', xp: 17320, hasPrize: true  },
  { rank: 3, username: 'EmekaSabi',    title: 'Scholar',   xp: 11990, hasPrize: true  },
  { rank: 4, username: 'TemiLexicon',  title: 'Scholar',   xp: 9430                   },
  { rank: 5, username: 'ChidiReads',   title: 'Scholar',   xp: 8200                   },
];

export const DEMO_LEADERBOARD_WAZOBIA: LeaderboardEntry[] = [
  { rank: 1, username: 'YorubaQueen',  title: 'Ìjọba Ẹdẹ', xp: 4200, hasPrize: true  },
  { rank: 2, username: 'AbíọláSpell',  title: 'Ìjọba Ẹdẹ', xp: 3850, hasPrize: true  },
  { rank: 3, username: 'TundeLexicon', title: 'Ọmọ Ẹdẹ',   xp: 3100, hasPrize: true  },
  { rank: 4, username: 'BisiWords',    title: 'Ọmọ Ẹdẹ',   xp: 2740                   },
  { rank: 5, username: 'KolaCraft',    title: 'Ọmọ Ẹdẹ',   xp: 2310                   },
];

// All-classes leaderboard blends Academic and Wazobia XP for demo purposes
export const DEMO_LEADERBOARD_ALL: LeaderboardEntry[] = [
  { rank: 1, username: 'AbiodunSpell', title: 'Word Sage', xp: 24040, hasPrize: true  },
  { rank: 2, username: 'FatimaWords',  title: 'Word Sage', xp: 21170, hasPrize: true  },
  { rank: 3, username: 'YorubaQueen',  title: 'Ìjọba Ẹdẹ', xp: 15200, hasPrize: true },
  { rank: 4, username: 'EmekaSabi',    title: 'Scholar',   xp: 11990                   },
  { rank: 5, username: 'TemiLexicon',  title: 'Scholar',   xp: 9430                    },
];

// ─────────────────────────────────────────────────────────────────────────────
// SabiBot profile (used in Arena mode — §5.5 of Hackathon PRD)
// ─────────────────────────────────────────────────────────────────────────────

export const SABIBOT_PROFILE = {
  username: 'SabiBot 🤖',
  ssr:      1150,
  title:    'Scholar',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Helper — insert the live user into a leaderboard at the correct rank position
// Call this at render time in leaderboard.tsx.
// ─────────────────────────────────────────────────────────────────────────────

export function insertLiveUser(
  board: LeaderboardEntry[],
  liveUser: { username: string; title: string; xp: number },
): LeaderboardEntry[] {
  const merged = [...board];

  // Find where the live user would sit among the hardcoded entries
  const insertIdx = merged.findIndex((e) => liveUser.xp > e.xp);

  const liveEntry: LeaderboardEntry = {
    rank:       insertIdx === -1 ? merged.length + 1 : insertIdx + 1,
    username:   liveUser.username,
    title:      liveUser.title,
    xp:         liveUser.xp,
    isLiveUser: true,
    hasPrize:   insertIdx !== -1 && insertIdx < 3,
  };

  if (insertIdx === -1) {
    // Live user ranks below all hardcoded entries
    return [...merged, liveEntry];
  }

  // Insert and shift ranks
  merged.splice(insertIdx, 0, liveEntry);
  return merged.map((e, i) => ({ ...e, rank: i + 1 }));
}
