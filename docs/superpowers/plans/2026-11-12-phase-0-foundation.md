# Phase 0 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the new Vite + React web app in `web/` with the tested, audience-neutral logic layer (collections, SSR, rewards, energy, placement, stores) and rewrite the project docs for the full product.

**Architecture:** A new self-contained app lives in `web/` next to the legacy Expo MVP, which stays untouched until the new app reaches parity (removed in Phase 1). Pure TypeScript logic is ported and generalised from "SSS tier" to "collections" (`classic`, `yoruba`), covered by Vitest. UI screens are out of scope (Phase 1, built from Figma layouts).

**Tech Stack:** Vite, React 19, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), Zustand, vite-plugin-pwa, Vitest + jsdom.

**Spec:** `docs/superpowers/specs/2026-11-12-full-product-design.md`

## Global Constraints

- Audience is everyone, levelled by skill. New code and new docs must not contain "SSS", "secondary school" or class-based gating. (Archived docs under `docs/archive/` are exempt.)
- Content model is **collections**: ids `classic` and `yoruba` only in this phase. Collection ids are the `CollectionId` type in `web/src/types.ts`.
- Tech: Vite + React + TypeScript + Tailwind, Zustand for state, `vite-plugin-pwa`. No Next.js, no Expo in `web/`, no native targets.
- SSR range is 100 to 2000. `classic` starts at 1100 with K=24. `yoruba` starts at 100 with K=32.
- Persisted store fields keep snake_case names (`daily_streak`, `word_history`, `last_energy_refill_ts`) to ease Supabase sync later. Store key is `sabispell:profile`.
- Reward multipliers combine as a product, then are capped at 2.5.
- Test runner is Vitest with the jsdom environment. Tests are colocated as `*.test.ts` next to the source.
- Legacy Expo code at the repository root (`app/`, `src/`, `assets/`, `app.json`, `package.json`) is NOT modified, except the two description-copy fixes in Task 11.
- All work is committed on `master`. Do not push; the owner pushes.
- Every commit message ends with a second `-m` paragraph: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Commands are bash (Git Bash on Windows). Run `web/` commands from `C:\Users\hp\SabiSpell-V1\SabiSpell\web` unless stated.
- Out of scope for this phase: `tts`, `audio`, `bgm` services (browser audio rewrite, Phase 1), arena store and SabiBot (Phase 4), leaderboard fixtures (Phase 4), any UI beyond the placeholder shell.

---

### Task 1: Scaffold the Vite app with Tailwind, PWA and Vitest

**Files:**
- Create: `web/package.json`, `web/.npmrc`, `web/.gitignore`, `web/tsconfig.json`, `web/vite.config.ts`, `web/index.html`, `web/src/main.tsx`, `web/src/App.tsx`, `web/src/index.css`, `web/public/icons/icon-192.png`, `web/public/icons/icon-512.png`

**Interfaces:**
- Produces: working `npm run dev`, `npm run build`, `npm test` scripts in `web/`; Tailwind enabled via `src/index.css`; PWA manifest generated at build.

- [ ] **Step 1: Create the folder and package.json**

```bash
cd /c/Users/hp/SabiSpell-V1/SabiSpell
mkdir -p web/src web/public/icons
cp public/icons/icon-192.png public/icons/icon-512.png web/public/icons/
```

Create `web/package.json`:

```json
{
  "name": "sabispell-web",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

Create `web/.npmrc` (earlier installs on this machine needed it):

```
legacy-peer-deps=true
```

Create `web/.gitignore`:

```
node_modules
dist
```

- [ ] **Step 2: Install dependencies**

```bash
cd web
npm install react react-dom zustand
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom vitest jsdom tailwindcss @tailwindcss/vite vite-plugin-pwa
```

Expected: installs without error. If the network resets (ECONNRESET), re-run the same command.

- [ ] **Step 3: Create config and entry files**

`web/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "types": ["vite/client"]
  },
  "include": ["src", "vite.config.ts"]
}
```

`web/vite.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SabiSpell',
        short_name: 'SabiSpell',
        description: 'Adaptive spelling game for everyone',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0A6EBD',
        background_color: '#0A6EBD',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  test: { environment: 'jsdom' },
});
```

`web/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#0A6EBD" />
    <link rel="icon" href="/icons/icon-192.png" />
    <link rel="apple-touch-icon" href="/icons/icon-192.png" />
    <title>SabiSpell</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`web/src/index.css`:

```css
@import "tailwindcss";
```

`web/src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`web/src/App.tsx` (placeholder, replaced in Task 10):

```tsx
export default function App() {
  return <h1 className="p-6 text-3xl font-bold">SabiSpell</h1>;
}
```

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: exits 0, ends with `built in`. Then run `ls dist` and confirm `manifest.webmanifest` and `sw.js` exist.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/hp/SabiSpell-V1/SabiSpell
git add web
git commit -m "feat(web): scaffold Vite + React + Tailwind PWA app" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Config, types and collections data

**Files:**
- Create: `web/src/config.ts`, `web/src/types.ts`, `web/src/data/collections.ts`, `web/src/data/words/classic.json` (copied), `web/src/data/words/yoruba.json` (copied)
- Test: `web/src/data/collections.test.ts`

**Interfaces:**
- Produces:
  - `Config` (const object, see code below)
  - `type CollectionId = 'classic' | 'yoruba'`
  - `interface Word { id; text; ssr: number; collection: CollectionId; language: string; definition: string; context_sentences: string[]; phonetic: string; etymology?: string; language_of_origin?: string; tone_guide?: string; proverb_id?: string }`
  - `interface Proverb { id; language; original; translation; word_id: string; tone_guide?: string }`
  - `interface Collection { id: CollectionId; name: string; description: string; free: boolean; startSSR: number; kFactor: number; energyCost: number; words: Word[] }`
  - `COLLECTIONS: Record<CollectionId, Collection>`, `COLLECTION_IDS: CollectionId[]`, `PROVERBS: Proverb[]`

- [ ] **Step 1: Copy the word banks**

```bash
cd /c/Users/hp/SabiSpell-V1/SabiSpell
mkdir -p web/src/data/words
cp assets/wordbanks/sss_wordbank.json web/src/data/words/classic.json
cp assets/wordbanks/yoruba_wordbank.json web/src/data/words/yoruba.json
```

`classic.json` is a JSON array of 100 entries (ids `sw_001`...). `yoruba.json` is an object with `words` (50 entries, ids `yw_001`...) and `proverbs` (4 entries). Do not edit them; the loader maps them.

- [ ] **Step 2: Write the failing test**

`web/src/data/collections.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { COLLECTION_IDS, COLLECTIONS, PROVERBS } from './collections';

describe('collections', () => {
  it('exposes classic and yoruba', () => {
    expect(COLLECTION_IDS).toEqual(['classic', 'yoruba']);
  });

  it('classic has at least 50 words, all tagged classic, unique ids, valid SSR', () => {
    const { words } = COLLECTIONS.classic;
    expect(words.length).toBeGreaterThanOrEqual(50);
    expect(words.every((w) => w.collection === 'classic')).toBe(true);
    expect(new Set(words.map((w) => w.id)).size).toBe(words.length);
    expect(words.every((w) => w.ssr >= 100 && w.ssr <= 2000)).toBe(true);
  });

  it('yoruba has 50 words tagged yoruba and 4 proverbs', () => {
    expect(COLLECTIONS.yoruba.words).toHaveLength(50);
    expect(COLLECTIONS.yoruba.words.every((w) => w.collection === 'yoruba')).toBe(true);
    expect(PROVERBS).toHaveLength(4);
  });

  it('no word keeps the legacy tier field', () => {
    for (const id of COLLECTION_IDS) {
      for (const w of COLLECTIONS[id].words) {
        expect('tier' in w).toBe(false);
      }
    }
  });

  it('uses the per-collection SSR start and K factor', () => {
    expect(COLLECTIONS.classic.startSSR).toBe(1100);
    expect(COLLECTIONS.classic.kFactor).toBe(24);
    expect(COLLECTIONS.yoruba.startSSR).toBe(100);
    expect(COLLECTIONS.yoruba.kFactor).toBe(32);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npm test`
Expected: FAIL (cannot resolve `./collections`).

- [ ] **Step 4: Write config, types and the collections loader**

`web/src/config.ts`:

```ts
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
```

`web/src/types.ts`:

```ts
export type CollectionId = 'classic' | 'yoruba';

export interface Word {
  id: string;
  text: string;
  ssr: number;
  collection: CollectionId;
  language: string;
  definition: string;
  context_sentences: string[];
  phonetic: string;
  etymology?: string;
  language_of_origin?: string;
  tone_guide?: string;
  proverb_id?: string;
}

export interface Proverb {
  id: string;
  language: string;
  original: string;
  translation: string;
  word_id: string;
  tone_guide?: string;
}
```

`web/src/data/collections.ts`:

```ts
import classicRaw from './words/classic.json';
import yorubaRaw from './words/yoruba.json';
import type { CollectionId, Proverb, Word } from '../types';

type RawWord = Omit<Word, 'collection'> & { tier?: string };

function toWords(raw: RawWord[], collection: CollectionId): Word[] {
  return raw.map(({ tier: _legacyTier, ...word }) => ({ ...word, collection }));
}

export interface Collection {
  id: CollectionId;
  name: string;
  description: string;
  free: boolean;
  startSSR: number;
  kFactor: number;
  energyCost: number;
  words: Word[];
}

const yoruba = yorubaRaw as unknown as { words: RawWord[]; proverbs: Proverb[] };

export const COLLECTIONS: Record<CollectionId, Collection> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'English vocabulary from everyday to advanced, levelled by your skill.',
    free: true,
    startSSR: 1100,
    kFactor: 24,
    energyCost: 1,
    words: toWords(classicRaw as unknown as RawWord[], 'classic'),
  },
  yoruba: {
    id: 'yoruba',
    name: 'Yoruba',
    description: 'Spell Yoruba words with tone marks and learn the proverbs behind them.',
    free: true,
    startSSR: 100,
    kFactor: 32,
    energyCost: 2,
    words: toWords(yoruba.words, 'yoruba'),
  },
};

export const COLLECTION_IDS = Object.keys(COLLECTIONS) as CollectionId[];
export const PROVERBS: Proverb[] = yoruba.proverbs;
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
cd /c/Users/hp/SabiSpell-V1/SabiSpell
git add web
git commit -m "feat(web): add config, types and word collections" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: SSR service

**Files:**
- Create: `web/src/services/ssr.ts`
- Test: `web/src/services/ssr.test.ts`

**Interfaces:**
- Consumes: `Config` from `../config`
- Produces:
  - `clampSSR(value: number): number` (clamps to `Config.SSR_MIN`..`Config.SSR_MAX`)
  - `calculateSSRDelta(playerSSR: number, wordSSR: number, isCorrect: boolean, kFactor: number): number` (integer delta after clamping)

- [ ] **Step 1: Write the failing test**

`web/src/services/ssr.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { calculateSSRDelta, clampSSR } from './ssr';

describe('calculateSSRDelta', () => {
  it('rewards a correct answer on a harder word (anchor +19)', () => {
    expect(calculateSSRDelta(1100, 1220, true, 24)).toBe(19);
  });

  it('penalises a wrong answer on an easier word (anchor -8)', () => {
    expect(calculateSSRDelta(1100, 980, false, 24)).toBe(-8);
  });

  it('uses the K factor', () => {
    expect(calculateSSRDelta(1100, 1220, true, 32)).toBe(26);
  });

  it('never pushes SSR above the max', () => {
    expect(calculateSSRDelta(2000, 2000, true, 24)).toBe(0);
  });

  it('never pushes SSR below the min', () => {
    expect(calculateSSRDelta(100, 100, false, 24)).toBe(0);
  });
});

describe('clampSSR', () => {
  it('clamps both ends', () => {
    expect(clampSSR(5000)).toBe(2000);
    expect(clampSSR(-5)).toBe(100);
    expect(clampSSR(1234)).toBe(1234);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- ssr`
Expected: FAIL (cannot resolve `./ssr`).

- [ ] **Step 3: Implement**

`web/src/services/ssr.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- ssr`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
cd /c/Users/hp/SabiSpell-V1/SabiSpell
git add web
git commit -m "feat(web): add SSR delta service" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Economy (rewards)

**Files:**
- Create: `web/src/services/economy.ts`
- Test: `web/src/services/economy.test.ts`

**Interfaces:**
- Consumes: `Config` from `../config`
- Produces: `interface RewardResult { xp: number; coins: number }`, `calculateReward(wordSSR: number, isCorrect: boolean, currentStreak: number, isDailyChallenge?: boolean): RewardResult`

- [ ] **Step 1: Write the failing test**

`web/src/services/economy.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { calculateReward } from './economy';

describe('calculateReward', () => {
  it('gives nothing for a wrong answer', () => {
    expect(calculateReward(1220, false, 10, true)).toEqual({ xp: 0, coins: 0 });
  });

  it('base reward: 5 + floor(ssr/200) coins, double in XP', () => {
    expect(calculateReward(1220, true, 0)).toEqual({ xp: 22, coins: 11 });
  });

  it('applies the streak tiers', () => {
    expect(calculateReward(1220, true, 3)).toEqual({ xp: 24, coins: 12 });
    expect(calculateReward(1220, true, 5)).toEqual({ xp: 28, coins: 14 });
  });

  it('multiplies streak by the daily challenge bonus', () => {
    expect(calculateReward(1220, true, 10, true)).toEqual({ xp: 50, coins: 25 });
  });

  it('daily challenge alone is 1.5x', () => {
    expect(calculateReward(1220, true, 0, true)).toEqual({ xp: 33, coins: 17 });
  });
});
```

(Check of the last case: coins `11 * 1.5 = 16.5` rounds to 17, xp `22 * 1.5 = 33`.)

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- economy`
Expected: FAIL (cannot resolve `./economy`).

- [ ] **Step 3: Implement**

`web/src/services/economy.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- economy`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
cd /c/Users/hp/SabiSpell-V1/SabiSpell
git add web
git commit -m "feat(web): add reward calculation" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Energy service

**Files:**
- Create: `web/src/services/energy.ts`
- Test: `web/src/services/energy.test.ts`

**Interfaces:**
- Consumes: `Config`
- Produces:
  - `interface EnergyRefillResult { energy: number; lastRefillTs: number }`
  - `interface EnergyDeductResult { success: boolean; energy: number; lastRefillTs: number }`
  - `calculateEnergyRefill(currentEnergy: number, lastRefillTs: number, now: number): EnergyRefillResult`
  - `deductEnergy(currentEnergy: number, amount: number, lastRefillTs: number, now: number): EnergyDeductResult`

- [ ] **Step 1: Write the failing test**

`web/src/services/energy.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { calculateEnergyRefill, deductEnergy } from './energy';

const MIN = 60 * 1000;
const INTERVAL = 15 * MIN;

describe('calculateEnergyRefill', () => {
  it('at cap, resets the timestamp to now', () => {
    expect(calculateEnergyRefill(5, 0, 1_000_000)).toEqual({ energy: 5, lastRefillTs: 1_000_000 });
  });

  it('adds one pip per 15 minutes and keeps the leftover time', () => {
    expect(calculateEnergyRefill(1, 0, 31 * MIN)).toEqual({ energy: 3, lastRefillTs: 2 * INTERVAL });
  });

  it('does nothing before a full interval has passed', () => {
    expect(calculateEnergyRefill(2, 1000, 1500)).toEqual({ energy: 2, lastRefillTs: 1000 });
  });

  it('caps energy and resets the timestamp when fully refilled', () => {
    expect(calculateEnergyRefill(1, 0, 10 * INTERVAL)).toEqual({ energy: 5, lastRefillTs: 10 * INTERVAL });
  });
});

describe('deductEnergy', () => {
  it('deducts when enough energy and keeps the running timer', () => {
    expect(deductEnergy(3, 1, 0, 0)).toEqual({ success: true, energy: 2, lastRefillTs: 0 });
  });

  it('starts the timer when deducting from a full bar', () => {
    expect(deductEnergy(5, 1, 0, 1000)).toEqual({ success: true, energy: 4, lastRefillTs: 1000 });
  });

  it('fails without changing energy when there is not enough', () => {
    expect(deductEnergy(1, 2, 0, 0)).toEqual({ success: false, energy: 1, lastRefillTs: 0 });
  });

  it('refills before checking', () => {
    const result = deductEnergy(0, 2, 0, 2 * INTERVAL);
    expect(result.success).toBe(true);
    expect(result.energy).toBe(0);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- energy`
Expected: FAIL (cannot resolve `./energy`).

- [ ] **Step 3: Implement**

`web/src/services/energy.ts`:

```ts
import { Config } from '../config';

export interface EnergyRefillResult {
  energy: number;
  lastRefillTs: number;
}

export interface EnergyDeductResult {
  success: boolean;
  energy: number;
  lastRefillTs: number;
}

export function calculateEnergyRefill(
  currentEnergy: number,
  lastRefillTs: number,
  now: number,
): EnergyRefillResult {
  if (currentEnergy >= Config.ENERGY_CAP) {
    return { energy: Config.ENERGY_CAP, lastRefillTs: now };
  }
  const pips = Math.floor((now - lastRefillTs) / Config.ENERGY_REFILL_INTERVAL_MS);
  if (pips <= 0) return { energy: currentEnergy, lastRefillTs };

  const energy = Math.min(Config.ENERGY_CAP, currentEnergy + pips);
  if (energy >= Config.ENERGY_CAP) return { energy, lastRefillTs: now };
  return { energy, lastRefillTs: lastRefillTs + pips * Config.ENERGY_REFILL_INTERVAL_MS };
}

export function deductEnergy(
  currentEnergy: number,
  amount: number,
  lastRefillTs: number,
  now: number,
): EnergyDeductResult {
  const refilled = calculateEnergyRefill(currentEnergy, lastRefillTs, now);
  if (refilled.energy < amount) {
    return { success: false, energy: refilled.energy, lastRefillTs: refilled.lastRefillTs };
  }
  const wasFull = refilled.energy >= Config.ENERGY_CAP;
  return {
    success: true,
    energy: refilled.energy - amount,
    lastRefillTs: wasFull ? now : refilled.lastRefillTs,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- energy`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
cd /c/Users/hp/SabiSpell-V1/SabiSpell
git add web
git commit -m "feat(web): add energy refill and deduction" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Word selection and text helpers

**Files:**
- Create: `web/src/services/wordbank.ts`
- Test: `web/src/services/wordbank.test.ts`

**Interfaces:**
- Consumes: `Config`, `PROVERBS` from `../data/collections`, `Word`/`Proverb` from `../types`
- Produces:
  - `getNextWord(playerSSR: number, words: Word[], sessionWords: string[], wordHistory: string[], rng?: () => number): Word | null`
  - `getProverbForWord(wordId: string, proverbs?: Proverb[]): Proverb | null`
  - `updateWordHistory(history: string[], wordId: string): string[]`
  - `maskWordInSentence(sentence: string, word: string): string`

- [ ] **Step 1: Write the failing test**

`web/src/services/wordbank.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Word } from '../types';
import { getNextWord, getProverbForWord, maskWordInSentence, updateWordHistory } from './wordbank';

const word = (id: string, ssr: number): Word => ({
  id,
  text: id,
  ssr,
  collection: 'classic',
  language: 'en',
  definition: '',
  context_sentences: [],
  phonetic: '',
});

const words = [word('a', 1000), word('b', 1100), word('c', 1250), word('d', 1900)];
const first = () => 0;
const last = () => 0.99;

describe('getNextWord', () => {
  it('picks within 300 SSR of the player', () => {
    expect(getNextWord(1100, words, [], [], first)?.id).toBe('a');
    expect(getNextWord(1100, words, [], [], last)?.id).toBe('c');
  });

  it('prefers words not seen before', () => {
    expect(getNextWord(1100, words, [], ['a', 'b'], first)?.id).toBe('c');
  });

  it('falls back to seen words when nothing fresh is in range', () => {
    expect(getNextWord(1100, words, [], ['a', 'b', 'c'], first)?.id).toBe('a');
  });

  it('skips words already used this session and widens the window', () => {
    expect(getNextWord(1100, words, ['a', 'b', 'c'], [], first)?.id).toBe('d');
  });

  it('returns null when every word is used', () => {
    expect(getNextWord(1100, words, ['a', 'b', 'c', 'd'], [], first)).toBeNull();
  });
});

describe('updateWordHistory', () => {
  it('appends once', () => {
    expect(updateWordHistory(['a'], 'b')).toEqual(['a', 'b']);
    expect(updateWordHistory(['a', 'b'], 'b')).toEqual(['a', 'b']);
  });
});

describe('maskWordInSentence', () => {
  it('masks case-insensitively', () => {
    expect(maskWordInSentence('The Aberration was odd', 'aberration')).toBe('The _____ was odd');
  });

  it('treats regex characters literally', () => {
    expect(maskWordInSentence('a.b and axb', 'a.b')).toBe('_____ and axb');
  });
});

describe('getProverbForWord', () => {
  it('finds the proverb for a Yoruba word', () => {
    expect(getProverbForWord('yw_012')?.id).toBe('yp_001');
  });

  it('returns null for words without one', () => {
    expect(getProverbForWord('sw_001')).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- wordbank`
Expected: FAIL (cannot resolve `./wordbank`).

- [ ] **Step 3: Implement**

`web/src/services/wordbank.ts`:

```ts
import { Config } from '../config';
import { PROVERBS } from '../data/collections';
import type { Proverb, Word } from '../types';

export function getNextWord(
  playerSSR: number,
  words: Word[],
  sessionWords: string[],
  wordHistory: string[],
  rng: () => number = Math.random,
): Word | null {
  const pool = words.filter((w) => !sessionWords.includes(w.id));
  const windows = [Config.SSR_WORD_PROXIMITY, Config.SSR_WORD_PROXIMITY_WIDE, Infinity];

  for (const window of windows) {
    const near = pool.filter((w) => Math.abs(w.ssr - playerSSR) <= window);
    if (near.length === 0) continue;
    const fresh = near.filter((w) => !wordHistory.includes(w.id));
    const choices = fresh.length > 0 ? fresh : near;
    return choices[Math.floor(rng() * choices.length)];
  }
  return null;
}

export function getProverbForWord(wordId: string, proverbs: Proverb[] = PROVERBS): Proverb | null {
  return proverbs.find((p) => p.word_id === wordId) ?? null;
}

export function updateWordHistory(history: string[], wordId: string): string[] {
  return history.includes(wordId) ? history : [...history, wordId];
}

export function maskWordInSentence(sentence: string, word: string): string {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return sentence.replace(new RegExp(escaped, 'gi'), '_____');
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- wordbank`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
cd /c/Users/hp/SabiSpell-V1/SabiSpell
git add web
git commit -m "feat(web): add word selection and text helpers" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Streak, titles and graduation

**Files:**
- Create: `web/src/services/streak.ts`, `web/src/services/titles.ts`, `web/src/services/graduation.ts`
- Test: `web/src/services/streak.test.ts`, `web/src/services/titles.test.ts`, `web/src/services/graduation.test.ts`

**Interfaces:**
- Consumes: `Config`
- Produces:
  - `todayISO(now?: Date): string` (local date as `YYYY-MM-DD`), `nextStreak(streak: number, lastPlayed: string, today: string): number`
  - `getXPTitle(xp: number): string`, `getNextTitleXP(xp: number): number | null`
  - `interface GraduationResult { passed: boolean; score: number; total: number; percentage: number; xpBonus: number; coinBonus: number }`, `isGraduationUnlocked(collectionWordHistory: string[]): boolean`, `processGraduationResult(score: number, total?: number): GraduationResult`, `formatPassRate(percentage: number): string`

- [ ] **Step 1: Write the failing tests**

`web/src/services/streak.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { nextStreak, todayISO } from './streak';

describe('nextStreak', () => {
  it('starts at 1 when never played', () => {
    expect(nextStreak(0, '', '2026-11-12')).toBe(1);
  });

  it('adds one for consecutive days', () => {
    expect(nextStreak(4, '2026-11-11', '2026-11-12')).toBe(5);
  });

  it('keeps the streak on the same day', () => {
    expect(nextStreak(4, '2026-11-12', '2026-11-12')).toBe(4);
  });

  it('resets after a gap', () => {
    expect(nextStreak(4, '2026-11-09', '2026-11-12')).toBe(1);
  });

  it('works across a month boundary', () => {
    expect(nextStreak(3, '2026-10-31', '2026-11-01')).toBe(4);
  });
});

describe('todayISO', () => {
  it('formats the local date', () => {
    expect(todayISO(new Date(2026, 10, 5))).toBe('2026-11-05');
  });
});
```

`web/src/services/titles.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getNextTitleXP, getXPTitle } from './titles';

describe('getXPTitle', () => {
  it('maps XP to titles at the boundaries', () => {
    expect(getXPTitle(0)).toBe('Recruit');
    expect(getXPTitle(2499)).toBe('Recruit');
    expect(getXPTitle(2500)).toBe('Cadet');
    expect(getXPTitle(6420)).toBe('Cadet');
    expect(getXPTitle(8000)).toBe('Scholar');
    expect(getXPTitle(40000)).toBe("VC's List");
  });
});

describe('getNextTitleXP', () => {
  it('returns the next threshold or null at the top', () => {
    expect(getNextTitleXP(6420)).toBe(8000);
    expect(getNextTitleXP(40000)).toBeNull();
  });
});
```

`web/src/services/graduation.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { formatPassRate, isGraduationUnlocked, processGraduationResult } from './graduation';

describe('isGraduationUnlocked', () => {
  it('needs 50 words in the collection', () => {
    expect(isGraduationUnlocked(Array.from({ length: 49 }, (_, i) => `w${i}`))).toBe(false);
    expect(isGraduationUnlocked(Array.from({ length: 50 }, (_, i) => `w${i}`))).toBe(true);
  });
});

describe('processGraduationResult', () => {
  it('passes at 75% and awards the bonus', () => {
    const r = processGraduationResult(15, 20);
    expect(r.passed).toBe(true);
    expect(r.xpBonus).toBe(1000);
    expect(r.coinBonus).toBe(400);
    expect(r.percentage).toBe(0.75);
  });

  it('fails below 75% with no bonus', () => {
    const r = processGraduationResult(14, 20);
    expect(r.passed).toBe(false);
    expect(r.xpBonus).toBe(0);
    expect(r.coinBonus).toBe(0);
  });

  it('defaults the exam length to 20 words', () => {
    expect(processGraduationResult(20).total).toBe(20);
  });

  it('handles an empty exam', () => {
    const r = processGraduationResult(0, 0);
    expect(r.percentage).toBe(0);
    expect(r.passed).toBe(false);
  });
});

describe('formatPassRate', () => {
  it('formats a percentage', () => {
    expect(formatPassRate(0.75)).toBe('75%');
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test -- streak titles graduation`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement**

`web/src/services/streak.ts`:

```ts
const pad = (n: number) => String(n).padStart(2, '0');

export function todayISO(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const dayNumber = (iso: string): number => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
};

export function nextStreak(streak: number, lastPlayed: string, today: string): number {
  if (!lastPlayed) return 1;
  const gap = dayNumber(today) - dayNumber(lastPlayed);
  if (gap <= 0) return streak;
  return gap === 1 ? streak + 1 : 1;
}
```

`web/src/services/titles.ts`:

```ts
import { Config } from '../config';

export function getXPTitle(xp: number): string {
  let title: string = Config.XP_TITLES[0].name;
  for (const t of Config.XP_TITLES) {
    if (xp >= t.minXP) title = t.name;
  }
  return title;
}

export function getNextTitleXP(xp: number): number | null {
  return Config.XP_TITLES.find((t) => t.minXP > xp)?.minXP ?? null;
}
```

`web/src/services/graduation.ts`:

```ts
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
  const percentage = total > 0 ? score / total : 0;
  const passed = percentage >= Config.GRADUATION_PASS_PERCENT;
  return {
    passed,
    score,
    total,
    percentage,
    xpBonus: passed ? Config.GRADUATION_XP_BONUS : 0,
    coinBonus: passed ? Config.GRADUATION_COIN_BONUS : 0,
  };
}

export function formatPassRate(percentage: number): string {
  return `${Math.round(percentage * 100)}%`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- streak titles graduation`
Expected: PASS (14 tests: 6 streak, 2 titles, 6 graduation).

- [ ] **Step 5: Commit**

```bash
cd /c/Users/hp/SabiSpell-V1/SabiSpell
git add web
git commit -m "feat(web): add streak, title and graduation services" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Placement round logic

**Files:**
- Create: `web/src/services/placement.ts`
- Test: `web/src/services/placement.test.ts`

**Interfaces:**
- Consumes: `Config`, `calculateSSRDelta` (Task 3), `getNextWord` (Task 6), `COLLECTIONS` (Task 2), `Word`
- Produces:
  - `interface PlacementAnswer { wordSSR: number; isCorrect: boolean }`
  - `computePlacementSSR(answers: PlacementAnswer[], startSSR?: number): number`
  - `nextPlacementWord(currentSSR: number, words: Word[], usedIds: string[], rng?: () => number): Word | null`

- [ ] **Step 1: Write the failing test**

`web/src/services/placement.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { Config } from '../config';
import { COLLECTIONS } from '../data/collections';
import { calculateSSRDelta } from './ssr';
import { computePlacementSSR, nextPlacementWord } from './placement';

describe('computePlacementSSR', () => {
  it('returns the start SSR with no answers', () => {
    expect(computePlacementSSR([])).toBe(1100);
  });

  it('rises when every answer is correct on hard words', () => {
    const answers = Array.from({ length: 8 }, () => ({ wordSSR: 1300, isCorrect: true }));
    expect(computePlacementSSR(answers)).toBeGreaterThan(1100);
  });

  it('falls when every answer is wrong on easy words', () => {
    const answers = Array.from({ length: 8 }, () => ({ wordSSR: 900, isCorrect: false }));
    expect(computePlacementSSR(answers)).toBeLessThan(1100);
  });

  it('stays inside the SSR range', () => {
    const answers = Array.from({ length: 200 }, () => ({ wordSSR: 2000, isCorrect: true }));
    const ssr = computePlacementSSR(answers);
    expect(ssr).toBeLessThanOrEqual(Config.SSR_MAX);
  });
});

describe('placement simulation on the classic collection', () => {
  const run = (isCorrectFor: (ssr: number) => boolean) => {
    let ssr: number = Config.SSR_START;
    const used: string[] = [];
    for (let i = 0; i < Config.PLACEMENT_WORDS; i++) {
      const w = nextPlacementWord(ssr, COLLECTIONS.classic.words, used, () => 0);
      if (!w) throw new Error('ran out of words');
      used.push(w.id);
      ssr += calculateSSRDelta(ssr, w.ssr, isCorrectFor(w.ssr), Config.PLACEMENT_K_FACTOR);
    }
    return { ssr, used };
  };

  it('asks 8 distinct words', () => {
    const { used } = run(() => true);
    expect(used).toHaveLength(8);
    expect(new Set(used).size).toBe(8);
  });

  it('places a perfect player above a player who misses everything', () => {
    expect(run(() => true).ssr).toBeGreaterThan(run(() => false).ssr);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- placement`
Expected: FAIL (cannot resolve `./placement`; `PLACEMENT_K_FACTOR` is already in `Config` from Task 2).

- [ ] **Step 3: Implement**

`web/src/services/placement.ts`:

```ts
import { Config } from '../config';
import type { Word } from '../types';
import { calculateSSRDelta } from './ssr';
import { getNextWord } from './wordbank';

export interface PlacementAnswer {
  wordSSR: number;
  isCorrect: boolean;
}

export function computePlacementSSR(
  answers: PlacementAnswer[],
  startSSR: number = Config.SSR_START,
): number {
  return answers.reduce(
    (ssr, a) => ssr + calculateSSRDelta(ssr, a.wordSSR, a.isCorrect, Config.PLACEMENT_K_FACTOR),
    startSSR,
  );
}

export function nextPlacementWord(
  currentSSR: number,
  words: Word[],
  usedIds: string[],
  rng?: () => number,
): Word | null {
  return getNextWord(currentSSR, words, usedIds, [], rng);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- placement`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
cd /c/Users/hp/SabiSpell-V1/SabiSpell
git add web
git commit -m "feat(web): add placement round logic" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Profile and game stores

**Files:**
- Create: `web/src/store/profileStore.ts`, `web/src/store/gameStore.ts`
- Test: `web/src/store/profileStore.test.ts`, `web/src/store/gameStore.test.ts`

**Interfaces:**
- Consumes: `Config`, `COLLECTIONS`/`COLLECTION_IDS` (Task 2), `clampSSR` (Task 3), `calculateEnergyRefill`/`deductEnergy` (Task 5), `updateWordHistory` (Task 6), `nextStreak`/`todayISO` (Task 7)
- Produces:
  - `interface Profile { username: string; hasOnboarded: boolean; ssr: Record<CollectionId, number>; xp: number; coins: number; daily_streak: number; last_played_date: string; word_history: Record<CollectionId, string[]>; energy: number; last_energy_refill_ts: number; graduations: Partial<Record<CollectionId, string>> }`
  - `createInitialProfile(now?: number): Profile`
  - `useProfileStore` with actions `completeOnboarding(username, placementSSR, now?)`, `addXPAndCoins(xp, coins)`, `updateSSR(collection, delta)`, `addWordToHistory(collection, wordId)`, `deductEnergy(amount, now?): boolean`, `refillEnergy(now?)`, `recordPlay(today?)`, `graduate(collection, date?)`, `reset(now?)`
  - `interface SessionHistoryItem { word: Word; isCorrect: boolean; userInput: string }`, `useGameStore` with `startNewSession()`, `setCurrentWord(word)`, `recordAnswer(isCorrect, userInput)`, `endSession()`

- [ ] **Step 1: Write the failing tests**

`web/src/store/profileStore.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { useProfileStore } from './profileStore';

const MIN = 60 * 1000;

beforeEach(() => {
  localStorage.clear();
  useProfileStore.getState().reset(0);
});

describe('profileStore', () => {
  it('starts with per-collection SSR and a full energy bar', () => {
    const s = useProfileStore.getState();
    expect(s.ssr).toEqual({ classic: 1100, yoruba: 100 });
    expect(s.coins).toBe(0);
    expect(s.energy).toBe(5);
    expect(s.hasOnboarded).toBe(false);
  });

  it('completes onboarding with the placement SSR and starter coins', () => {
    useProfileStore.getState().completeOnboarding('  Ade  ', 1350, 0);
    const s = useProfileStore.getState();
    expect(s.username).toBe('Ade');
    expect(s.hasOnboarded).toBe(true);
    expect(s.coins).toBe(150);
    expect(s.ssr.classic).toBe(1350);
    expect(s.ssr.yoruba).toBe(100);
  });

  it('adds XP and coins', () => {
    useProfileStore.getState().addXPAndCoins(22, 11);
    expect(useProfileStore.getState().xp).toBe(22);
    expect(useProfileStore.getState().coins).toBe(11);
  });

  it('clamps SSR updates', () => {
    useProfileStore.getState().updateSSR('classic', 5000);
    expect(useProfileStore.getState().ssr.classic).toBe(2000);
    useProfileStore.getState().updateSSR('classic', -5000);
    expect(useProfileStore.getState().ssr.classic).toBe(100);
  });

  it('records each word once per collection', () => {
    useProfileStore.getState().addWordToHistory('classic', 'sw_001');
    useProfileStore.getState().addWordToHistory('classic', 'sw_001');
    useProfileStore.getState().addWordToHistory('yoruba', 'yw_001');
    const s = useProfileStore.getState();
    expect(s.word_history.classic).toEqual(['sw_001']);
    expect(s.word_history.yoruba).toEqual(['yw_001']);
  });

  it('deducts energy and refuses when short', () => {
    expect(useProfileStore.getState().deductEnergy(1, 0)).toBe(true);
    expect(useProfileStore.getState().energy).toBe(4);
    expect(useProfileStore.getState().deductEnergy(10, 0)).toBe(false);
    expect(useProfileStore.getState().energy).toBe(4);
  });

  it('refills energy over time', () => {
    useProfileStore.setState({ energy: 1, last_energy_refill_ts: 0 });
    useProfileStore.getState().refillEnergy(31 * MIN);
    expect(useProfileStore.getState().energy).toBe(3);
  });

  it('tracks the daily streak', () => {
    useProfileStore.getState().recordPlay('2026-11-11');
    useProfileStore.getState().recordPlay('2026-11-12');
    useProfileStore.getState().recordPlay('2026-11-12');
    expect(useProfileStore.getState().daily_streak).toBe(2);
    expect(useProfileStore.getState().last_played_date).toBe('2026-11-12');
  });

  it('records graduation per collection', () => {
    useProfileStore.getState().graduate('classic', '2026-11-12');
    expect(useProfileStore.getState().graduations).toEqual({ classic: '2026-11-12' });
  });

  it('persists to localStorage under the profile key', () => {
    useProfileStore.getState().addXPAndCoins(40, 0);
    const saved = JSON.parse(localStorage.getItem('sabispell:profile')!);
    expect(saved.state.xp).toBe(40);
  });
});
```

`web/src/store/gameStore.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import type { Word } from '../types';
import { useGameStore } from './gameStore';

const word = (id: string): Word => ({
  id,
  text: id,
  ssr: 1100,
  collection: 'classic',
  language: 'en',
  definition: '',
  context_sentences: [],
  phonetic: '',
});

beforeEach(() => {
  useGameStore.getState().startNewSession();
});

describe('gameStore', () => {
  it('tracks words used this session once', () => {
    useGameStore.getState().setCurrentWord(word('a'));
    useGameStore.getState().setCurrentWord(word('a'));
    expect(useGameStore.getState().sessionWords).toEqual(['a']);
  });

  it('scores answers and builds the spell streak', () => {
    const g = useGameStore.getState();
    g.setCurrentWord(word('a'));
    g.recordAnswer(true, 'a');
    g.setCurrentWord(word('b'));
    g.recordAnswer(true, 'b');
    expect(useGameStore.getState().sessionScore).toBe(2);
    expect(useGameStore.getState().spellStreak).toBe(2);
    g.setCurrentWord(word('c'));
    g.recordAnswer(false, 'x');
    expect(useGameStore.getState().spellStreak).toBe(0);
    expect(useGameStore.getState().sessionHistory).toHaveLength(3);
  });

  it('ignores an answer when no word is active', () => {
    useGameStore.getState().recordAnswer(true, 'a');
    expect(useGameStore.getState().sessionHistory).toHaveLength(0);
  });

  it('marks the session complete and resets on a new one', () => {
    useGameStore.getState().endSession();
    expect(useGameStore.getState().isComplete).toBe(true);
    useGameStore.getState().startNewSession();
    expect(useGameStore.getState().isComplete).toBe(false);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test -- Store`
Expected: FAIL (stores not found).

- [ ] **Step 3: Implement the profile store**

`web/src/store/profileStore.ts`:

```ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Config } from '../config';
import { COLLECTIONS, COLLECTION_IDS } from '../data/collections';
import { calculateEnergyRefill, deductEnergy as deductEnergyPips } from '../services/energy';
import { clampSSR } from '../services/ssr';
import { nextStreak, todayISO } from '../services/streak';
import { updateWordHistory } from '../services/wordbank';
import type { CollectionId } from '../types';

export interface Profile {
  username: string;
  hasOnboarded: boolean;
  ssr: Record<CollectionId, number>;
  xp: number;
  coins: number;
  daily_streak: number;
  last_played_date: string;
  word_history: Record<CollectionId, string[]>;
  energy: number;
  last_energy_refill_ts: number;
  graduations: Partial<Record<CollectionId, string>>;
}

function perCollection<T>(make: (id: CollectionId) => T): Record<CollectionId, T> {
  return Object.fromEntries(COLLECTION_IDS.map((id) => [id, make(id)])) as Record<CollectionId, T>;
}

export function createInitialProfile(now: number = Date.now()): Profile {
  return {
    username: '',
    hasOnboarded: false,
    ssr: perCollection((id) => COLLECTIONS[id].startSSR),
    xp: 0,
    coins: 0,
    daily_streak: 0,
    last_played_date: '',
    word_history: perCollection(() => []),
    energy: Config.ENERGY_CAP,
    last_energy_refill_ts: now,
    graduations: {},
  };
}

interface ProfileActions {
  completeOnboarding(username: string, placementSSR: number, now?: number): void;
  addXPAndCoins(xp: number, coins: number): void;
  updateSSR(collection: CollectionId, delta: number): void;
  addWordToHistory(collection: CollectionId, wordId: string): void;
  deductEnergy(amount: number, now?: number): boolean;
  refillEnergy(now?: number): void;
  recordPlay(today?: string): void;
  graduate(collection: CollectionId, date?: string): void;
  reset(now?: number): void;
}

export const useProfileStore = create<Profile & ProfileActions>()(
  persist(
    (set, get) => ({
      ...createInitialProfile(),

      completeOnboarding: (username, placementSSR, now = Date.now()) =>
        set((s) => ({
          username: username.trim(),
          hasOnboarded: true,
          coins: s.coins + Config.STARTER_COINS,
          ssr: { ...s.ssr, classic: clampSSR(placementSSR) },
          energy: Config.ENERGY_CAP,
          last_energy_refill_ts: now,
        })),

      addXPAndCoins: (xp, coins) => set((s) => ({ xp: s.xp + xp, coins: s.coins + coins })),

      updateSSR: (collection, delta) =>
        set((s) => ({ ssr: { ...s.ssr, [collection]: clampSSR(s.ssr[collection] + delta) } })),

      addWordToHistory: (collection, wordId) =>
        set((s) => ({
          word_history: {
            ...s.word_history,
            [collection]: updateWordHistory(s.word_history[collection], wordId),
          },
        })),

      deductEnergy: (amount, now = Date.now()) => {
        const { energy, last_energy_refill_ts } = get();
        const r = deductEnergyPips(energy, amount, last_energy_refill_ts, now);
        set({ energy: r.energy, last_energy_refill_ts: r.lastRefillTs });
        return r.success;
      },

      refillEnergy: (now = Date.now()) =>
        set((s) => {
          const r = calculateEnergyRefill(s.energy, s.last_energy_refill_ts, now);
          return { energy: r.energy, last_energy_refill_ts: r.lastRefillTs };
        }),

      recordPlay: (today = todayISO()) =>
        set((s) => ({
          daily_streak: nextStreak(s.daily_streak, s.last_played_date, today),
          last_played_date: today,
        })),

      graduate: (collection, date = todayISO()) =>
        set((s) => ({ graduations: { ...s.graduations, [collection]: date } })),

      reset: (now = Date.now()) => set(createInitialProfile(now)),
    }),
    {
      name: Config.STORAGE_KEYS.PROFILE,
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
```

- [ ] **Step 4: Implement the game store**

`web/src/store/gameStore.ts`:

```ts
import { create } from 'zustand';
import type { Word } from '../types';

export interface SessionHistoryItem {
  word: Word;
  isCorrect: boolean;
  userInput: string;
}

interface GameState {
  currentWord: Word | null;
  sessionWords: string[];
  sessionScore: number;
  spellStreak: number;
  isComplete: boolean;
  sessionHistory: SessionHistoryItem[];
  startNewSession(): void;
  setCurrentWord(word: Word): void;
  recordAnswer(isCorrect: boolean, userInput: string): void;
  endSession(): void;
}

const emptySession = () => ({
  currentWord: null as Word | null,
  sessionWords: [] as string[],
  sessionScore: 0,
  spellStreak: 0,
  isComplete: false,
  sessionHistory: [] as SessionHistoryItem[],
});

export const useGameStore = create<GameState>((set, get) => ({
  ...emptySession(),

  startNewSession: () => set(emptySession()),

  setCurrentWord: (word) =>
    set((s) => ({
      currentWord: word,
      sessionWords: s.sessionWords.includes(word.id) ? s.sessionWords : [...s.sessionWords, word.id],
    })),

  recordAnswer: (isCorrect, userInput) => {
    const { currentWord } = get();
    if (!currentWord) return;
    set((s) => ({
      sessionScore: s.sessionScore + (isCorrect ? 1 : 0),
      spellStreak: isCorrect ? s.spellStreak + 1 : 0,
      sessionHistory: [...s.sessionHistory, { word: currentWord, isCorrect, userInput }],
    }));
  },

  endSession: () => set({ isComplete: true }),
}));
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- Store`
Expected: PASS (profileStore 10 tests, gameStore 4 tests).

- [ ] **Step 6: Commit**

```bash
cd /c/Users/hp/SabiSpell-V1/SabiSpell
git add web
git commit -m "feat(web): add profile and game stores" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Placeholder app shell wired to the logic layer

**Files:**
- Modify: `web/src/App.tsx`

**Interfaces:**
- Consumes: `COLLECTION_IDS`, `COLLECTIONS` (Task 2), `useProfileStore` (Task 9), `getXPTitle` (Task 7)

- [ ] **Step 1: Replace the placeholder**

`web/src/App.tsx`:

```tsx
import { COLLECTION_IDS, COLLECTIONS } from './data/collections';
import { getXPTitle } from './services/titles';
import { useProfileStore } from './store/profileStore';

export default function App() {
  const xp = useProfileStore((s) => s.xp);

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-3xl font-bold">SabiSpell</h1>
      <p className="mt-1 text-slate-600">Spelling for everyone. Your title: {getXPTitle(xp)}</p>
      <ul className="mt-6 space-y-3">
        {COLLECTION_IDS.map((id) => (
          <li key={id} className="rounded-xl border border-slate-200 p-4">
            <h2 className="font-semibold">{COLLECTIONS[id].name}</h2>
            <p className="text-sm text-slate-600">{COLLECTIONS[id].description}</p>
            <p className="mt-1 text-xs text-slate-500">
              {COLLECTIONS[id].words.length} words · {COLLECTIONS[id].free ? 'Free' : 'Pro'}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 2: Verify typecheck, tests and build**

Run: `npm test && npm run build`
Expected: all tests pass, build exits 0, `dist/manifest.webmanifest` exists.

- [ ] **Step 3: Check it in the browser**

Run: `npm run dev` and open the printed local URL.
Expected: page shows "SabiSpell", the title "Recruit", and two cards (Classic with 100 words, Yoruba with 50 words, both Free). Stop the server with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
cd /c/Users/hp/SabiSpell-V1/SabiSpell
git add web
git commit -m "feat(web): show collections in the placeholder shell" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Docs revamp

**Files:**
- Create: `docs/PRODUCT.md`
- Modify: `README.md`, `app.json` (description copy), `public/manifest.json` (description copy)
- Move: `docs/SabiSpell_Hackathon_PRD.md`, `docs/walkthrough.md` into `docs/archive/`

**Interfaces:**
- Consumes: `docs/superpowers/specs/2026-11-12-full-product-design.md` sections 1 to 3

- [ ] **Step 1: Archive the hackathon docs with a banner**

```bash
cd /c/Users/hp/SabiSpell-V1/SabiSpell
mkdir -p docs/archive
git mv docs/SabiSpell_Hackathon_PRD.md docs/archive/SabiSpell_Hackathon_PRD.md
git mv docs/walkthrough.md docs/archive/walkthrough.md
BANNER='> **Archived.** This document describes the SSS 2 hackathon MVP built on Expo. The current plan is in [../PRODUCT.md](../PRODUCT.md).'
for f in docs/archive/SabiSpell_Hackathon_PRD.md docs/archive/walkthrough.md; do
  { printf '%s\n\n' "$BANNER"; cat "$f"; } > "$f.tmp" && mv "$f.tmp" "$f"
done
head -3 docs/archive/walkthrough.md
```

Expected: the first line printed is the banner.

- [ ] **Step 2: Generate PRODUCT.md from spec sections 1 to 3**

```bash
SPEC=docs/superpowers/specs/2026-11-12-full-product-design.md
{
  printf '# SabiSpell: Product Requirements\n\n'
  printf '> Source of truth for the full product. Derived from the 2026-11-12 design spec (`%s`).\n\n' "$SPEC"
  sed -n '/^## 1\. Product definition/,/^## 4\. Docs revamp/p' "$SPEC" | sed '$d'
} > docs/PRODUCT.md
grep -c "^## " docs/PRODUCT.md
```

Expected: prints `3` (sections 1, 2 and 3).

- [ ] **Step 3: Rewrite README.md**

Replace the entire content of `README.md` with:

````markdown
# SabiSpell

SabiSpell is a gamified, adaptive spelling Progressive Web App for anyone who wants to spell and learn words better. It levels every player by skill rather than by school class, and adds cultural word collections such as Yoruba.

## Status

SabiSpell is moving from a hackathon MVP to a full product. The plan and roadmap are in [docs/PRODUCT.md](docs/PRODUCT.md).

- `web/` is the new app (Vite + React). It currently contains the tested logic layer and a placeholder shell.
- The MVP (Expo) still lives at the repository root until the new app reaches parity.

## Features

- **Adaptive engine:** an ELO-style Skill Rating (SSR) places each player and picks words near their level.
- **Collections:** choose what to practise. Classic English vocabulary and Yoruba today, with Igbo, Hausa, exam and topic collections planned.
- **Progression:** XP titles from Recruit to VC's List, coins, energy, daily streaks and graduation certificates.
- **Arena (planned):** play SabiBot, scaled to your skill, or a real player.
- **SabiSpell Pro (planned):** a subscription for unlimited energy and all collections.

## Tech stack

- **New app (`web/`):** Vite, React, TypeScript, Tailwind CSS, Zustand, vite-plugin-pwa, Vitest.
- **Planned:** Supabase (auth, database, realtime) and Paystack (payments).
- **MVP (repository root):** Expo / React Native Web.

## Getting started

```bash
cd web
npm install
npm run dev      # start the dev server
npm test         # run the logic tests
npm run build    # production build (PWA output in web/dist)
```

## Documentation

- [Product requirements and roadmap](docs/PRODUCT.md)
- [Design spec](docs/superpowers/specs/2026-11-12-full-product-design.md)
- [Phase 0 plan](docs/superpowers/plans/2026-11-12-phase-0-foundation.md)
- [Archived MVP docs](docs/archive/)

## Credits

- **YarnGPT:** the Yoruba word audio is synthesised with [YarnGPT's](https://yarngpt.ai) Yoruba voice model.

## License

MIT. See [LICENSE](LICENSE).
````

- [ ] **Step 4: Fix copy in the legacy manifest and app config**

Run: `grep -n "SSS\|secondary" app.json public/manifest.json`

Each match is a `description` value. Edit each matching line with the Edit tool, replacing only the description text with `Adaptive spelling game for everyone` (keep the key, quotes and trailing comma).

Then verify: `grep -n "SSS\|secondary" app.json public/manifest.json`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add README.md docs app.json public/manifest.json
git commit -m "docs: add PRODUCT.md, rewrite README, archive MVP docs" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Final verification

**Files:** none changed unless a check fails.

- [ ] **Step 1: Run the full web checks**

```bash
cd /c/Users/hp/SabiSpell-V1/SabiSpell/web
npm test
npm run build
```

Expected: every test passes (68 tests in 11 files), build exits 0, `dist/manifest.webmanifest` and `dist/sw.js` exist.

- [ ] **Step 2: Confirm the new code is audience-neutral**

```bash
cd /c/Users/hp/SabiSpell-V1/SabiSpell
grep -rniE "SSS|secondary school" web/src docs/PRODUCT.md README.md || echo "clean"
```

Expected: `clean`, except possible hits inside `web/src/data/words/classic.json` content (word definitions), which are data and are accepted.

- [ ] **Step 3: Confirm the legacy app still builds**

```bash
npx expo export -p web
```

Expected: exits 0. (The Expo code was not modified apart from description copy.)

- [ ] **Step 4: Check the repository state**

```bash
git status -sb
git log --oneline -12
```

Expected: clean tree except the already-pending `package.json`/`package-lock.json` Expo update (not part of this plan). Report the commit list to the owner. Do not push.
