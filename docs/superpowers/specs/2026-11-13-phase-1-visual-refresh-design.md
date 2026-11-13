# Phase 1: Visual refresh and playable core

Date: 2026-11-13. Parent spec: [full-product design](2026-11-12-full-product-design.md). Builds on Phase 0 (`web/`).

## 1. Goal

Ship a playable, local-only SabiSpell in `web/` with a new identity: brand assets, Figma layouts, and the core player flow built on React Router, Tailwind and the Phase 0 stores. No backend.

## 2. Decisions

- **Order:** 1a brand, then 1b Figma, then 1c build. Each stage ends with the owner's review before the next starts.
- **Style:** playful and bold. Chunky rounded shapes, bright colours, large Àjàlá mascot, game feel.
- **Palette:** keep blue primary (#0A6EBD). Gold for coins and XP, green for correct, red for wrong. Exact values are fixed in 1a.
- **Theme:** light only. Dark mode is out of scope.
- **Layout:** mobile-first. Desktop is the same layout centred with a max width, not a separate design.
- **Input:** custom on-screen `SpellingKeyboard` only (ported from the old app). The round has no text input, so physical keys are ignored and there is nothing to paste into. This is the anti-cheat choice. Yoruba collections get a tone-mark row.
- **Audio:** reuse the existing mp3 clips (English `sw_###`, Yoruba, effects). Words without a clip use the Web Speech API.
- **Out of scope:** Arena, shop, leaderboard, sign-in, Pro gating, dark mode, new content.

## 3. Stage 1a: Brand (Ideogram)

Needs the owner to authorise the Ideogram MCP (`/mcp`).

Deliverables in `web/public/brand/` and `web/src/assets/`:
- Logo: wordmark plus Àjàlá mark, SVG or high-res PNG.
- App icon: 192, 512 and a maskable 512 (safe zone respected). Replace the current icons in `web/public/icons/` and update the manifest `purpose`.
- Five Àjàlá poses: standard, happy, sad, graduation, streak.
- Design tokens (colours, type scale, radius, shadow) as Tailwind v4 `@theme` variables in `web/src/index.css`. One rounded friendly web font, self-hosted or Google Fonts.
- Owner picks from generated options before anything is built on it.

## 4. Stage 1b: Layouts (Figma)

Needs the owner to authorise the Figma MCP.

- One Figma file: tokens as variables, a component kit, then screens at mobile width with a desktop check.
- Components: button (primary, secondary, disabled), card, spelling keyboard, letter slots, energy pips, XP bar, coin and streak chips, modal, bottom nav.
- Screens: onboarding, placement, collection picker, round, result, dashboard, profile, graduation (with certificate).
- Owner reviews and approves the file before 1c.

## 5. Stage 1c: Build

### 5.1 Routing and shell
React Router with routes: `/` (redirect by `hasOnboarded`), `/onboarding`, `/placement`, `/collections`, `/play/:collectionId`, `/result`, `/dashboard`, `/profile`, `/graduation`. A route guard sends users who have not onboarded to `/onboarding`. Vercel rewrite of all routes to `/index.html` via `web/vercel.json`.

### 5.2 Screens and behaviour
- **Onboarding:** username, then placement. Calls `completeOnboarding`.
- **Placement:** `PLACEMENT_WORDS` words, `nextPlacementWord`, then `computePlacementSSR(answers, COLLECTIONS.classic.startSSR)` and `updateSSR('classic', ...)`.
- **Collection picker:** all collections, Pro ones shown locked but not purchasable yet. Shows SSR per collection and energy cost.
- **Round:** pick word with `getNextWord`, play audio, mask the sentence with `maskWordInSentence`, spell on the on-screen keyboard, submit. On submit: `calculateSSRDelta` with `COLLECTIONS[id].kFactor`, `deductEnergy` with `COLLECTIONS[id].energyCost`, `calculateReward`, `addXPAndCoins`, `updateSSR`, `addWordToHistory`, `recordPlay`. Streak and daily bonus flow through `calculateReward`.
- **Result:** summary of the round, XP title change, mascot pose by outcome.
- **Dashboard:** title, XP bar, coins, streak, energy with refill countdown, collection shortcuts.
- **Profile:** username, stats, graduations.
- **Graduation:** `isGraduationUnlocked`, exam round, `processGraduationResult`, certificate view.
- **Energy:** `calculateEnergyRefill` applied on app load and on a timer tick.

### 5.3 Platform pieces
- Audio helper: play mp3 by word id, fall back to `speechSynthesis`, mute toggle persisted in storage.
- Game store (`gameStore.ts`) gains collection, per-word timer and hint state.
- PWA: updated icons, `theme_color`, manifest `purpose` for the maskable icon.

### 5.4 Phase 0 hand-off fixes (all required in this phase)
- Callers use `COLLECTIONS[id].kFactor` and `.energyCost`, never literals.
- Persist `migrate` function added before any `version` bump.
- Bound `word_history` (cap per collection) and catch localStorage quota errors on write.
- `web/.npmrc` `legacy-peer-deps` and `workbox-window` re-checked when `virtual:pwa-register` is used for update prompts.

### 5.5 Legacy removal
Once the new app reaches parity on the flow above and the owner confirms, delete the Expo app at the repo root (`app/`, `src/`, `assets/` after moving needed audio, images and word banks into `web/`, root `package.json`, `app.json`, `public/manifest.json`). Move assets first, delete last, in its own task.

## 6. Testing and acceptance

- Unit tests stay green; new tests for the audio helper, round-scoring orchestration, route guard and the persist `migrate` and history cap.
- Component tests (Vitest + Testing Library) for keyboard, round, placement and result.
- Browser check with Chrome DevTools MCP: full flow onboarding to result on a phone viewport, offline-not-required, console clean.
- `tsc`, tests and `npm run build` clean. Lighthouse PWA installability passes with the new icons.
- Acceptance: a new player completes onboarding, placement, a round in Classic and in Yoruba, sees the result, and finds energy, XP and streak updated after reload.

## 7. Risks and open items

- Both design MCPs need owner OAuth before 1a and 1b can start.
- Ideogram output may need several rounds to produce a consistent mascot across five poses.
- Yoruba tone-mark keyboard layout needs owner input on character set (see 1b).
- Fonts and mascot images raise the bundle size; check the budget in 1c.
- The owner commits changes; execution waits for commits between tasks.
