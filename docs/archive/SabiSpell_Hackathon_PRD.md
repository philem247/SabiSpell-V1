> **Archived.** This document describes the SSS 2 hackathon MVP built on Expo. The current plan is in [../PRODUCT.md](../PRODUCT.md).

# SabiSpell — Hackathon Prototype PRD
### Tier Focus: SSS 2 | Timeline: 4 Weeks | Status: LOCKED ✅ | Date: 2026-05-26

> **Revision: PWA pivot (2026-11-12).** SabiSpell is now a Progressive Web App (Expo / React Native Web static export) that runs in the browser, is installable via "Add to Home screen", and is deployed on Vercel over HTTPS. It is no longer a native Android app. The offline-first requirement is dropped: an internet connection is required and there is no service worker. Persistence uses AsyncStorage, which maps to browser `localStorage` (per-device, lost if browser data is cleared, no cloud sync). Android/iOS scripts, `eas.json` and APK/EAS builds have been removed. Sections below are updated accordingly; everything else is unchanged.

---

## §1 Overview & Objective

This document defines the scope, build plan, and demo strategy for the SabiSpell **Hackathon Prototype** — a working installable PWA built in 4 weeks to demonstrate the core product hypothesis to investors, judges, and potential partners.

### Prototype Hypothesis
*"Nigerian SSS 2 students will engage more with spelling practice when it feels competitive, culturally authentic, and rewards their effort with visible progress."*

### What This Demo Must Prove
1. The SSR adaptive engine feels fair and personalised.
2. Yoruba Wazobia Mode is emotionally resonant and genuinely educational.
3. The economy (XP titles, coins, graduation) creates meaningful long-term motivation.
4. The app is an **installable PWA** — it runs in any modern browser, with no app-store install.
5. The design is premium enough to compete in an international hackathon.

### Target Audience for the Demo
- Hackathon judges (EdTech, cultural preservation, Nigeria-specific impact tracks)
- Seed/angel investors (EdTech, African consumer apps)
- School principals and teachers (B2B potential)
- Press and social media (product-market fit signal)

---

## §2 Scope Decisions

### What Is IN the Prototype
| Feature | Rationale |
|:---|:---|
| Academic League — SSS 2 only | Best vocabulary level for impressive demos; WAEC-relevant words |
| Yoruba Wazobia Mode | Single strongest cultural differentiator; most developed word bank |
| Graduation Exam + Certificate | High-emotion moment for demos and social sharing |
| SSR/ELO adaptive engine (K=24, SSS tier) | Core tech differentiation — show adaptive difficulty in real time |
| XP economy — 5 titles, SSS thresholds | Show long-term retention hooks |
| Coin economy — earn + hint spend | Demonstrate sink/source balance |
| Energy system (simplified, 5 energy cap) | Shows real-product design thinking |
| Àjàlá mascot — all 5 states | Character-driven emotion; investors love mascots |
| Leaderboard (hardcoded top-5 + live user) | Social competition feel without backend |
| Simulated "SabiBot" Arena opponent | Lets judges experience Arena without needing 2 phones |
| Certificate — SVG export, shareable (Web Share with file, else PNG download) | Wow moment for demos and social proof |
| Installable PWA (web manifest, HTTPS on Vercel, Add to Home screen; internet required, no service worker) | Zero-friction distribution — a link is all a judge or student needs; Supabase not required for prototype |
| Demo mode — pre-seeded Scholar profile | Judges can see a mature game state without grinding |

### What Is OUT of the Prototype
| Feature | Reason Excluded |
|:---|:---|
| Native Android APK / iOS app | Product is a PWA; no app-store build, EAS build or native scripts |
| Offline-first / service worker | Internet is required for the prototype; offline support is not a goal |
| Igbo, Hausa, French word banks | Time — Yoruba is sufficient for the cultural story |
| Primary, JSS, Elite Bee tiers | Focus demo on SSS 2 — the highest-impact tier for WAEC narrative |
| Real Supabase backend | Not needed for the prototype |
| Real Paystack IAP | Show UI only — "Coming soon" on purchase button |
| Real AdMob ads | Show placeholder only |
| Push notifications | Not needed for 4-week demo |
| School Mode / B2B dashboard | Phase 3+ feature |
| Igbo Udu / Hausa Goje audio (full) | Yoruba Gangan drum is sufficient for the cultural audio story |
| Spell Arena with real players | Use SabiBot (simulated opponent) |
| Sync queue / guest migration | No backend; everything stays in the browser's localStorage on that device |
| French word bank | Next iteration |

---

## §3 Target Tier: SSS 2

### Why SSS 2?
- Vocabulary range (SSR 1000–1500) is impressive enough to wow judges.
- Direct connection to WAEC preparation — a ₦8 billion market pain point.
- Students are 15–16 years old — active on social media, will share certificates.
- "Exam Warrior" dark theme unlocks at SSS 3 (keep SSS 2 as Lagoon Blue for contrast in demo).

### SSS 2 SSR Profile
| Parameter | Value |
|:---|:---|
| Tier | `sss` |
| Declared class | `SSS 2` |
| K-factor | 24 |
| Starting SSR (diagnostic skip) | 1,100 |
| SSR range | 1,001 – 1,499 |
| Words per round | 5 |
| Time per word | 45 seconds |
| Energy cap | 10 |
| XP title thresholds | Recruit 0 → Cadet 2,500 → Scholar 8,000 → Sage 20,000 → VC's List 40,000 |

### Demo Seed Profile (pre-loaded for investor demos)
```json
{
  "username": "SpellChampion",
  "declaredClass": "SSS 2",
  "academic_ssr": 1187,
  "xp": 6420,
  "coins": 340,
  "daily_streak": 12,
  "word_history": { "sss": ["sw_001","sw_002","sw_003","sw_007","sw_010"] },
  "current_title": "Scholar",
  "energy": 8
}
```
This profile is in the "Scholar" title range, has a 12-day streak, and is visibly progressing toward "Word Sage" — creates an aspirational demo state.

---

## §4 Prototype Screens (10 of 15 Full PRD Screens)

### Screen 1 — Splash
Route guard. `hasOnboarded = true` → Demo Dashboard. 2-second Àjàlá (Standard) display. SabiSpell wordmark.

### Screen 2 — Onboarding (Simplified, 1 Step)
Username input only (no avatar choice — use default Àjàlá avatar). "Play as SSS 2 Student" CTA. Sets `hasOnboarded = true`. Awards 150 starter coins. Routes to Dashboard.

### Screen 3 — Dashboard
Energy bar (Lagoon Blue, 8/10 shown in demo seed). Coin counter. XP bar ("Scholar" title, progress to "Word Sage"). 12-day streak flame. Daily Challenge card (active). Game mode grid: Academic League (prominent), Wazobia Mode, Spell Arena. Àjàlá (Standard). "Play Now" large CTA.

### Screen 4 — Game Mode Selection
Three active cards: **Academic League** (SSS 2, energy cost 1), **Wazobia Mode** (Yoruba, energy cost 2), **Spell Arena** (SabiBot, energy cost 2). Sandbox and Review shown but greyed out with "Coming soon" tooltip.

### Screen 5 — Gameplay HUD (Academic League)
**Lagoon Blue theme.** Word dashes → TTS auto-plays → dashes fill on reveal. Text input. Submit. Hint button (costs 10 coins for SSS range). Timer bar (45s). Spell streak (fire icon). Energy: 8/10. Àjàlá reactions. Context sentence below input. **Key demo word:** "juxtaposition" — judges love seeing advanced vocabulary adaptive delivery.

### Screen 6 — Gameplay HUD (Wazobia Mode)
**Terracotta theme.** Ankara tile pattern background at 8% opacity. DiacriticKeyboard above system keyboard. Gangan drum plays on correct answer. Proverb shown after correct: *"Bí a bá ń sọ èdè wa, a ń pamọ́ ẹni tí a jẹ́."* (When we speak our language, we preserve who we are). Àjàlá (Wazobia state — Fila cap + coral beads). Example word: "ìmọ̀" (knowledge).

### Screen 7 — Result Screen
Per-word result (tick/cross, correct spelling for misses). Animated XP counter. Animated coin counter. SSR delta (e.g., +18 ↑). Streak update (13-day → "🔥 13-day streak!"). Share button: "I just spelled 'juxtaposition' and earned 28 XP on SabiSpell!" Àjàlá (correct: bounce + "Ẹ kú ìjókòó! 🎉" / wrong: shake + "Gbiyanju!" ). Play Again + Home CTAs.

### Screen 8 — Leaderboard
**3 tabs:** SSS 2 | All Classes | Wazobia.
**SSS 2 tab — hardcoded top 5 + live user:**
```
1. 🏆 AbiodunSpell   — Word Sage   — 19,840 XP
2.    FatimaWords    — Word Sage   — 17,320 XP
3.    EmekaSabi      — Scholar     — 11,990 XP
4.    TemiLexicon    — Scholar     — 9,430 XP
5.    ChidiReads     — Scholar     — 8,200 XP
---
[Live user position shown below]
```
Weekly prize indicator (MTN data badge 🏆) on top 3. Àjàlá points to user's rank.

### Screen 9 — Graduation Exam
**Unlock condition (simplified):** `word_history.sss.length >= 5` for demo (actual: 50).
20-word exam. SSR range 1,200–1,499. 75% threshold (15/20). 45s timer per word. No hints. Àjàlá (Exam Warrior state). Result: pass → Certificate modal.

### Screen 10 — Certificate
SVG rendered in the browser. Fields: username, "SSS 2 Academic League", date, SabiSpell seal. Àjàlá (Graduation state — cap toss, gold confetti). "Share to WhatsApp" → PNG capture → `navigator.share` with the PNG file where supported, otherwise the PNG is downloaded. This is the **single highest-emotion moment of the demo** — always end live demos here.

---

## §5 Core Mechanics (Prototype Implementation)

### 5.1 SSR Engine (Identical to Full PRD)
```typescript
// K = 24 for SSS tier
S_expected = 1 / (1 + 10^((word_ssr - player_ssr) / 400))
M_delta    = 24 × (S_actual - S_expected) × (isCorrect ? 1.2 : 1.0)
new_ssr    = Math.max(100, Math.min(2000, player_ssr + M_delta))
```
SSR updated after each individual word. `getNextWord()` reads latest SSR before each selection.

### 5.2 Word Bank (SSS Wordbank)
Load `assets/wordbanks/sss_wordbank.json` (50 words, SSR 1010–1580). Filter by `Math.abs(word.ssr - player_ssr) <= 300` for each word selection. Shuffle filtered list, pick first unused in current session. Track `word_history.sss[]` in AsyncStorage (browser `localStorage` on web).

### 5.3 Economy (Per-word commit)
```typescript
base_coins = 5 + Math.floor(word_ssr / 200)   // 10–12 for SSS 2 range
base_xp    = base_coins * 2                    // 20–24 for SSS 2 range
// Multipliers: streak (if ≥ 3: 1.1×), Daily Challenge (1.5×)
// Cap: 2.5× total
```
XP and coins written to AsyncStorage (browser `localStorage`) immediately after each correct answer. Prototype: no Supabase sync needed. Because storage is per-device and per-browser, progress is lost if the user clears browser data and does not follow the user to another device.

### 5.4 Energy (Simplified for Prototype)
Cap: 5 energy (simpler for demo, not 10). Refill: 1 per 15 minutes (wall clock, `Date.now()`). Costs: Academic 1, Wazobia 2, Arena 2. Free refill button available in demo mode (for judges who want to replay). Energy state persists in `localStorage` with the rest of the profile.

### 5.5 SabiBot Arena (Simulated Opponent)
```typescript
// SabiBot answers with randomised timing to feel human
const botCorrectProbability = 0.72   // Bot gets ~72% of words right
const botAnswerDelayMs = () => Math.random() * 8000 + 5000  // 5–13s delay
```
SabiBot profile: `{ username: "SabiBot 🤖", ssr: 1150, title: "Scholar" }`. Same word list as player (seeded). Bot's progress bar updates every 10s. Post-match: show podium with SabiBot result. Player typically wins 55–60% of rounds against SabiBot at equivalent SSR.

### 5.6 Demo Mode Toggle
Add `__DEMO_MODE__` flag in `AppConfig.ts`. When true:
- Graduation unlock threshold reduced to 5 words (from 50)
- Energy refill button shown (red "Demo: Refill Energy" button in Settings)
- Leaderboard uses hardcoded data (not Supabase fetch)
- Daily Challenge always shows as active

The demo seed is written to `localStorage` on first load; the Demo Controls "Reset profile" action restores it (clearing browser data has the same effect).

---

## §6 Technical Architecture (Prototype)

### 6.1 Stack (Same as Full PRD, Supabase removed for prototype)
```
Expo + Expo Router, exported as a static web build (React Native Web)
react-native-web / react-dom (browser renderer)
Zustand (profileStore, gameStore, arenaStore)
AsyncStorage → browser localStorage on web (per-device, no cloud sync)
react-native-svg (Certificate, Ankara pattern)
react-native-view-shot (certificate PNG capture)
expo-audio (mp3 sound effects, Yoruba audio; starts after first user tap)
expo-speech (TTS; fallback for Yoruba audio)
expo-font (Space Grotesk, Inter, Source Code Pro)
expo-router (file-based navigation)
```
**No Supabase in prototype.** All data lives in browser `localStorage` via AsyncStorage. Leaderboard is hardcoded + local user appended. Deployed as static files on Vercel over HTTPS.

### 6.2 File Structure (Phase 1 Prototype)
```
SpellForge/
├── app/
│   ├── +html.tsx                 # Web HTML shell (manifest link, meta, theme colour)
│   ├── _layout.tsx               # Font loading, Expo Router shell
│   ├── index.tsx                 # Splash + route guard
│   ├── onboarding.tsx            # Simplified 1-step onboarding
│   ├── dashboard.tsx             # Screen 3
│   ├── mode-select.tsx           # Screen 4
│   ├── game/
│   │   ├── academic.tsx          # Screen 5 - Academic HUD
│   │   ├── wazobia.tsx           # Screen 6 - Wazobia HUD
│   │   └── arena.tsx             # SabiBot Arena HUD
│   ├── result.tsx                # Screen 7
│   ├── leaderboard.tsx           # Screen 8
│   ├── graduation.tsx            # Screen 9
│   └── certificate.tsx           # Screen 10
├── public/
│   ├── manifest.json             # PWA manifest (name, icons, display: standalone)
│   ├── index.html                # Web entry template
│   └── icons/                    # PWA icons (192, 512, maskable)
├── src/
│   ├── store/
│   │   ├── profileStore.ts       # Zustand + AsyncStorage (localStorage)
│   │   ├── gameStore.ts          # Session state
│   │   └── arenaStore.ts         # SabiBot session state
│   ├── services/
│   │   ├── ssr.ts                # calculateSSRDelta()
│   │   ├── wordbank.ts           # getNextWord(), updateWordHistory()
│   │   ├── economy.ts            # calculateReward()
│   │   ├── energy.ts             # deductEnergy(), refillEnergy()
│   │   ├── tts.ts                # speak(), checkLocaleAvailable()
│   │   ├── audio.ts              # playCorrect(), playWrong()
│   │   └── graduation.ts         # isGraduationUnlocked()
│   ├── components/
│   │   ├── DiacriticKeyboard.tsx # Yoruba diacritic input
│   │   ├── AjalaAvatar.tsx       # Mascot state renderer
│   │   ├── XPBar.tsx             # Animated progress bar
│   │   ├── EnergyBar.tsx         # Energy pip display
│   │   ├── CertificateSVG.tsx    # SVG certificate renderer
│   │   ├── AnkaraTile.tsx        # Repeating SVG background
│   │   └── LeaderboardRow.tsx    # Row component
│   └── constants/
│       ├── Colors.ts             # OKLch design tokens
│       ├── AppConfig.ts          # __DEMO_MODE__, word bank version
│       └── DemoSeeds.ts          # Pre-loaded demo profile
├── assets/
│   ├── fonts/
│   │   ├── SpaceGrotesk-*.ttf
│   │   ├── Inter-*.ttf
│   │   └── SourceCodePro-Regular.ttf
│   ├── images/
│   │   ├── ajala_standard.png
│   │   ├── ajala_exam_warrior.png
│   │   ├── ajala_wazobia.png
│   │   ├── ajala_sandbox.png
│   │   └── ajala_graduation.png
│   ├── patterns/
│   │   └── ankara_tile.svg
│   ├── audio/                    # mp3s bundled and served as static assets
│   │   ├── gangan_correct.wav
│   │   ├── wrong_wazobia.wav
│   │   ├── graduation_fanfare.wav
│   │   └── streak_pop.wav
│   └── wordbanks/
│       ├── sss_wordbank.json     # 50 SSS words (primary demo bank)
│       └── yoruba_wordbank.json  # 50 Yoruba words + 4 proverbs
├── vercel.json                   # SPA rewrite to index.html
└── package.json
```

---

## §7 Asset Checklist

| Asset | Status | Location |
|:---|:---|:---|
| `ajala_standard.png` | ✅ Generated | Brain artifacts dir |
| `ajala_exam_warrior.png` | ✅ Generated | Brain artifacts dir |
| `ajala_wazobia.png` | ✅ Generated | Brain artifacts dir |
| `ajala_sandbox.png` | ✅ Generated | Brain artifacts dir |
| `ajala_graduation.png` | ✅ Generated | Brain artifacts dir |
| `ankara_tile.svg` | ✅ Generated | Brain artifacts dir |
| `sss_wordbank.json` | ✅ Generated (50 words) | Brain artifacts dir |
| `yoruba_wordbank.json` | ✅ Generated (50 words + proverbs) | Brain artifacts dir |
| `gangan_correct.wav` | ✅ Generated | Brain artifacts dir |
| `wrong_wazobia.wav` | ✅ Generated | Brain artifacts dir |
| `graduation_fanfare.wav` | ✅ Generated | Brain artifacts dir |
| `streak_pop.wav` | ✅ Generated | Brain artifacts dir |
| Space Grotesk font | ❌ Download from Google Fonts | fonts.google.com |
| Inter font | ❌ Download from Google Fonts | fonts.google.com |
| Source Code Pro font | ❌ Download from Google Fonts | fonts.google.com |
| Supabase account | ✅ Created | (your account) |
| Paystack account | ✅ Created | (your account) |
| AdMob account | ✅ Created | (your account) |

**Before starting Week 1:** Copy all generated assets from the brain artifacts directory into `SpellForge/assets/` following the file structure in §6.2.

---

## §8 Week-by-Week Build Plan

---

### WEEK 1 — Scaffold, SSR Engine & Core Data (Days 1–7)

**Goal:** Project running in the browser. SSR engine working. Dashboard renders with demo seed data.

**Day 1 — Project Init:**
```powershell
cd C:\Users\hp\SpellForge   # or chosen project directory
npx create-expo-app . --template expo-template-blank-typescript
npm install expo-router zustand @react-native-async-storage/async-storage react-native-svg expo-audio expo-speech expo-font react-native-web react-dom react-native-view-shot
npm run web                 # dev server in the browser
```
- Create file structure from §6.2.
- Copy all generated assets into `assets/` subdirectories.
- Configure `app.json`: `name: "SabiSpell"`, `slug: "sabispell"`, `web: { bundler: "metro", output: "static" }`. No `android.package`; native Android/iOS scripts are not used.

**Day 2 — Design System:**
- `src/constants/Colors.ts` — implement Lagoon Blue (SSS theme) and Terracotta (Wazobia theme) OKLch tokens.
- `src/constants/AppConfig.ts` — `__DEMO_MODE__ = true`, `WORD_BANK_VERSION = "1.0.0"`.
- `src/constants/DemoSeeds.ts` — export `DEMO_PROFILE` object (Scholar, 12-day streak, 6,420 XP).
- `app/_layout.tsx` — `useFonts()` loading Space Grotesk + Inter + Source Code Pro. Splash screen hold until fonts loaded.

**Day 3 — SSR Engine (Most Important Service):**
- `src/services/ssr.ts` — implement `calculateSSRDelta()`. Write inline unit test comments:
  - `player=1100, word=1220, correct → expected Δ ≈ +19`
  - `player=1100, word=980, wrong → expected Δ ≈ -8`
- `src/services/wordbank.ts` — `loadWordBank()` (JSON import), `getNextWord()` (SSR proximity filter + session deduplication), `updateWordHistory()`.

**Day 4 — Profile & Storage:**
- `src/store/profileStore.ts` — Zustand store with `persist()` middleware targeting AsyncStorage (browser `localStorage` on web). All fields from §6.2. Load `DEMO_PROFILE` as initial state when `__DEMO_MODE__ = true`.
- `src/store/gameStore.ts` — session-level store: `currentWord`, `sessionWords[]`, `sessionScore`, `spellStreak`.
- `src/services/economy.ts` — `calculateReward(wordSSR, isCorrect, multipliers)`. Returns `{ xp, coins }`.

**Day 5 — Splash + Onboarding:**
- `app/index.tsx` — Route guard: read `hasOnboarded` from AsyncStorage. If true → `/dashboard`. Else → `/onboarding`. Show Àjàlá Standard + logo for 2s.
- `app/onboarding.tsx` — Username input. Validation (3–20 chars). "Play as SSS 2 Student" CTA. On submit: set `hasOnboarded`, `declaredTier = 'sss'`, `declaredClass = 'SSS 2'`, award 150 coins. Route to Dashboard.

**Day 6 — Dashboard:**
- `app/dashboard.tsx` — render `EnergyBar`, coin counter, `XPBar` (title + progress), streak flame, Daily Challenge card (always active in demo mode), game mode grid, Àjàlá Standard.
- `src/components/EnergyBar.tsx` — pip display, colour by tier theme.
- `src/components/XPBar.tsx` — animated fill, title label, next-title threshold shown.

**Day 7 — Energy Service + End-of-Week Test:**
- `src/services/energy.ts` — `deductEnergy()`, `refillEnergy()` (wall-clock based), `getEnergyCap()`.
- Manual test in the browser: launch app, see Dashboard with demo seed. Confirm XP bar shows "Scholar". Confirm 12-day streak flame. Close the tab → reopen → all values preserved (localStorage).

---

### WEEK 2 — Game Loop, Audio & Result Screen (Days 8–14)

**Goal:** Full Academic League round playable. Audio working. Result Screen animated.

**Day 8 — Mode Selection + TTS:**
- `app/mode-select.tsx` — 3 mode cards (Academic, Wazobia, Arena). Energy cost shown. Greyed-out modes with tooltip.
- `src/services/tts.ts` — `speak(word, 'en')` using `expo-speech`. `checkLocaleAvailable('yo')` — fallback to en-NG if Yoruba TTS unavailable in the browser/device.

**Day 9 — Academic Gameplay HUD:**
- `app/game/academic.tsx` — full Gameplay HUD:
  - On mount: `getNextWord()` → set `currentWord` → TTS auto-play → 1s delay → reveal word dashes.
  - Text input → on submit: validate. If correct: `calculateSSRDelta()`, `calculateReward()`, commit to `profileStore`, play `streak_pop`, animate tick. If wrong: show correct spelling 2s, play wrong audio.
  - After each word: `updateWordHistory()`, advance to next word.
  - After 5 words: navigate to Result Screen.
- `src/components/AjalaAvatar.tsx` — renders correct PNG based on `state` prop. Add bounce animation on correct answer, shake animation on wrong.

**Day 10 — Audio Integration:**
- `src/services/audio.ts` — load bundled audio files via `expo-audio`. `playCorrect('en')` → `streak_pop`. `playWrong()` → `wrong_wazobia`. `playCelebration()` → `graduation_fanfare`. Audio is initialised after the first user tap (browser autoplay policy).
- Test in desktop and mobile Chrome — verify audio plays without lag after the first tap.

**Day 11 — Result Screen:**
- `app/result.tsx` — per-word breakdown. Animated XP counter (count up from 0). Animated coin counter. SSR delta badge (green ↑ or red ↓). Streak update. Share button (Web Share API where available, pre-written text). Play Again + Home CTAs.
- Add Àjàlá reaction: if `sessionScore >= 4/5` → Graduation state briefly, then Standard. If `<= 2/5` → Sandbox state.

**Day 12 — Graduation Exam (Critical Demo Screen):**
- `app/graduation.tsx` — 20-word exam. SSR range 1,200–1,499. 45s timer (countdown bar). No hint button. Àjàlá Exam Warrior state.
- `src/services/graduation.ts` — `isGraduationUnlocked(tier, wordHistory)`: in demo mode checks `wordHistory.sss.length >= 5` (instead of 50). `processGraduationResult(score, total)`: returns `{ passed: score/total >= 0.75, xpBonus: 1000, coinBonus: 400 }`.
- On pass → navigate to Certificate.

**Day 13 — Certificate Screen:**
- `app/certificate.tsx` — `CertificateSVG` component renders SVG with dynamic fields. Àjàlá Graduation PNG overlay. Share button: capture with `react-native-view-shot` → PNG → `navigator.share({ files })` where supported, otherwise download the PNG.
- `src/components/CertificateSVG.tsx` — SVG layout: border, SabiSpell seal, player name, tier text, date, Àjàlá graduation image embedded.
- Play `graduation_fanfare` on screen mount. Gold confetti animation (simple rain of `⭐` / `🎉` using Animated API).

**Day 14 — Week 2 Test:**
Full round test: Dashboard → Mode Select → Academic (5 words) → Result → Leaderboard → Graduation Exam (pass) → Certificate → Share. Verify all audio plays. Verify XP/coins persist across a page reload / browser restart.

---

### WEEK 3 — Wazobia Mode, Leaderboard & Profile Polish (Days 15–21)

**Goal:** Wazobia Mode working end-to-end. Leaderboard functional. App feels premium.

**Day 15 — Tongue Selection + Wazobia Wordbank:**
- `app/game/wazobia.tsx` — show Tongue Selection inline (Yoruba only; Igbo/Hausa/French shown as "Coming soon — ìgbà yẹn!" greyed-out cards).
- Load `assets/wordbanks/yoruba_wordbank.json`. Implement separate `wazobia_ssr` SSR track (K=32).

**Day 16 — DiacriticKeyboard:**
- `src/components/DiacriticKeyboard.tsx` — row of diacritic buttons: `ọ ẹ ṣ ú à è ì ọ̀ ẹ̀`. Mounted above the on-screen keyboard via `KeyboardAvoidingView`. Tap appends character to TextInput ref. For first 50 words: buttons dimmed + tooltip "Tone marks optional for now".

**Day 17 — Wazobia HUD Full:**
- Apply Terracotta colour theme to Wazobia HUD screen.
- `src/components/AnkaraTile.tsx` — render `ankara_tile.svg` as repeating background using `react-native-svg` pattern element. Set 8% opacity.
- On correct answer: play `gangan_correct`. Show proverb from word's `proverb_id` in a bottom sheet: Yoruba text + English translation.
- Àjàlá Wazobia PNG in HUD top-right.

**Day 18 — Wazobia Result + SSR:**
- Wazobia result feeds `wazobia_ssr` (not `academic_ssr`). Track `wazobia_words_completed.yo` counter.
- On result screen: show Wazobia SSR delta in addition to XP/coins. Cultural flavor text: "O dara! Your Yoruba is growing 🌿" on pass.

**Day 19 — Leaderboard:**
- `app/leaderboard.tsx` — 3 tabs: SSS 2, All Classes, Wazobia.
- `src/constants/DemoSeeds.ts` — export `DEMO_LEADERBOARD_SSS2` (top 5 hardcoded entries). Append live user from `profileStore` at correct rank position (if XP < entry 5: rank 6; else: replace appropriate entry).
- Render `LeaderboardRow` component: rank number, avatar initial, username, title badge, XP. Weekly prize badge (🏆 MTN data icon) on top 3.

**Day 20 — SabiBot Arena:**
- `app/game/arena.tsx` — Arena HUD with split view: player column + SabiBot column.
- `src/store/arenaStore.ts` — `{ botCorrectCount, botAnswerTimers[], isComplete }`.
- On each word: player answers normally. SabiBot "answers" after `botAnswerDelayMs()` (5–13s random). `botCorrect = Math.random() < 0.72`. Bot score bar animates. After 5 words: show podium.

**Day 21 — Polish Sprint:**
- All screen transitions: `expo-router` slide animations.
- Micro-animations: coin counter tick (Animated.Value), XP bar fill (Animated.timing), streak flame pulse (Animated.loop + scale).
- Review all screens for visual consistency — Lagoon Blue (Academic) and Terracotta (Wazobia) themes fully applied.

---

### WEEK 4 — Demo Prep, QA & Hardening (Days 22–28)

**Goal:** Demo-ready, bug-free, runs flawlessly in the browser (desktop and mobile Chrome) at the presentation.

**Day 22 — Shop Screen (Placeholder):**
- `app/shop.tsx` — pack grid showing all 6 premium packs (JAMB Literature, 10-Year WAEC, etc.) with lock icon and price. "Purchase" button shows WebView placeholder: "Paystack coming soon!". Coin Shop: shows balance, "Watch ad for +5 coins" button (logs but doesn't show real ad). Restore Purchases button (no-op in prototype).

**Day 23 — Profile Screen:**
- `app/profile.tsx` — avatar display, username, title badge, SSR rating, XP bar, streak, graduation badge (if graduated). "Change Class" button (disabled, shows "Available after 30 days" tooltip in demo). "Link Account" button (shows Supabase sign-up screen — can be blank in prototype, shows "Backend coming soon!").

**Day 24 — Demo Mode Finalisation:**
- `__DEMO_MODE__ = true` in `AppConfig.ts`.
- Add "Demo Controls" hidden panel (tap Àjàlá logo 5 times on Dashboard): Reset profile, Refill energy, Force unlock graduation, Set XP to just below "Word Sage" threshold (for dramatic progression demo).
- Pre-load `DEMO_PROFILE` (Scholar, 12-day streak) as default first-launch state.

**Day 25 — Browser & PWA Testing:**
- Test in desktop Chrome and in mobile Chrome on a physical Android phone (low-end, 2 GB RAM preferred), plus Safari on iOS if available.
- Run a Lighthouse PWA audit: confirm the app is installable (valid `manifest.json`, icons, HTTPS) and that "Add to Home screen" launches it in standalone mode.
- Verify audio plays (bundled mp3 via `expo-audio`) without 500ms+ lag after the first tap; verify the expo-speech fallback for Yoruba.
- Verify Ankara tile SVG renders without a blank screen on low RAM.
- Verify `graduation_fanfare` plays on the Certificate screen.
- Verify DiacriticKeyboard characters append correctly.
- Verify the certificate share: `navigator.share` with file where supported, otherwise the PNG download.
- Verify profile data persists across reload (localStorage).

**Day 26 — Bug Fix Day:**
- Fix any issues from Day 25 testing.
- Verify no `null` returns from `getNextWord()` during 3 consecutive sessions.
- Verify XP/coins survive a page reload / browser restart at every screen.
- Fix any visual clipping issues on smaller screens (360×640 viewport baseline).

**Day 27 — Demo Script Rehearsal:**
- Load the deployed demo URL on the demo device. Run through the full 7-minute demo script (§9) 3 times end-to-end.
- Confirm Graduation Exam + Certificate flow works with demo mode (5-word threshold).
- Screenshot: Certificate with your name. This is your hero image for the pitch deck.

**Day 28 — Web Export & Vercel Deploy:**
```powershell
cd SpellForge
npm run build:web          # expo export -p web -> dist/
vercel --prod              # deploy dist/ (vercel.json provides the SPA rewrite)
```
- Confirm `vercel.json` rewrites all routes to `index.html`, and that the production URL is served over HTTPS (required for install and `navigator.share`).
- Record the `dist/` size and share the production URL with the team for a final device test.

---

## §9 Demo Script (7-Minute Investor/Hackathon Walkthrough)

**Before the demo:** Device fully charged and connected to the internet (the app requires it). Production URL open in Chrome (optionally installed via Add to Home screen). Demo profile loaded (Scholar state). Brightness maximum. Tap the screen once before the demo starts so audio is unlocked.

---

**[00:00 – 00:45] Hook: The Problem**
> "45 million Nigerian students prepare for WAEC every year. Most of them have never used a spelling app designed for them — in their language, with their culture, affordable enough for their family. Here's what we built."

→ *Open app. Splash screen plays. Àjàlá appears. Dashboard loads.*

**[00:45 – 02:00] The Core Loop**
> "This is Emeka — SSS 2 student, Lagos. He has a 12-day streak. His XP just hit Scholar level. Watch what the adaptive engine does when he plays."

→ *Tap Academic League. Mode Selection screen. Tap Academic League card.*
→ *Game starts. Word: "juxtaposition". TTS reads it aloud. Show typing it. Submit — correct.*
→ *Àjàlá bounces. "+22 XP, +12 coins. SSR: ↑18." Show animated counters.*
→ "The engine just made the next word harder. Not randomly — mathematically, based on his exact ability."
→ *Complete 5-word round. Show Result Screen.*

**[02:00 – 03:30] The Cultural Heart**
> "But here's where SabiSpell is different from every other spelling app."

→ *From Mode Select: tap Wazobia Mode → Yoruba.*
→ *Ankara tile pattern appears. Àjàlá changes to Fila cap. Word: "ìmọ̀".*
→ *DiacriticKeyboard slides up. Type "ìmọ̀". Submit — correct.*
→ *Gangan drum plays. Proverb appears: "Bí a bá ń sọ èdè wa, a ń pamọ́ ẹni tí a jẹ́." — "When we speak our language, we preserve who we are."*
→ "We're not just teaching spelling. We're preserving Yoruba, Igbo, and Hausa for the next generation."

**[03:30 – 04:30] Competition**
> "Now — every student needs something to compete for."

→ *Open Leaderboard. Show top 5 with MTN prize badge.*
→ "Top 3 in the weekly league win real MTN data. Sponsors pay us. Students win prizes. Teachers get data on their class."

→ *Open Arena. SabiBot match starts. Both progress bars animate.*
→ "Real-time competition — right now, Emeka is competing against SabiBot. In production, it's a real classmate in Kano."

**[04:30 – 05:45] The Graduation Moment**
> "The most powerful moment in SabiSpell. Watch."

→ *Tap Graduation Exam on Dashboard (demo mode unlocked).*
→ *Show 3 words of the exam quickly.*
→ "75% pass threshold. This is WAEC-level. No hints."
→ *Submit final answer. "PASSED!" screen.*
→ *Certificate appears. Àjàlá tosses graduation cap. Fanfare plays.*
→ "Emeka just graduated. He gets a certificate. He shares it — right now, to WhatsApp."
→ *Tap Share. Share sheet opens (or the PNG downloads on browsers without Web Share support).*
→ "And his friends open the link and play SabiSpell."

**[05:45 – 07:00] The Business**
> "How we make money: Premium WAEC prep packs and school subscriptions at an affordable price. Sponsor integrations with MTN and Indomie. And it's a lightweight PWA — no app-store install, and it works in the browser of a low-end phone."

→ *Show Shop screen briefly. Show pack prices.*

> "The Nigerian EdTech market is ₦2.3 trillion. We are starting with spelling — the simplest, most universal academic skill — and building upward. We are not building for Silicon Valley. We are building for the student in Kano who has a low-end Android phone and a WAEC exam in March."

→ **End demo. Open for questions.**

---

## §10 Success Criteria for the Prototype

| Criterion | Target |
|:---|:---|
| Full Academic League round (5 words) playable | ✅ Must pass |
| Yoruba Wazobia Mode with DiacriticKeyboard | ✅ Must pass |
| SSR changes after each word (show in UI) | ✅ Must pass |
| Graduation Exam + Certificate + Share | ✅ Must pass |
| Gangan drum audio plays on correct Yoruba answer | ✅ Must pass |
| Installable PWA: valid manifest, installs via Add to Home screen on mobile Chrome | ✅ Must pass |
| Lighthouse PWA "installable" check passes | ✅ Must pass |
| XP/coins survive page reload / browser restart (localStorage) | ✅ Must pass |
| Cold load < 3s on 4G | ✅ Must pass |
| `dist/` size recorded (target: keep the static export lean for low-end phones) | ✅ Must pass |
| SabiBot Arena round completes without crash | Should pass |
| Leaderboard renders with hardcoded data | Should pass |
| Certificate PNG shares (`navigator.share`) or downloads successfully | Should pass |

---

*SabiSpell Hackathon Prototype PRD — LOCKED.*
*Tier: SSS 2 | Timeline: 4 Weeks | Next step: Phase 1 Day 1 — Project Init.*
