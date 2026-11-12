> **Archived.** This document describes the SSS 2 hackathon MVP built on Expo. The current plan is in [../PRODUCT.md](../PRODUCT.md).

# Walkthrough — Week 4 — Verification, Rehearsals & Build Phase

This document summarizes the QA validations, rehearsals, and build deliverables completed during the final week of SabiSpell prototype development (Days 25–28).

> **Revision: PWA pivot (2026-11-12).** SabiSpell is now a PWA (Expo / React Native Web static export) running in the browser, installable via Add to Home screen and deployed on Vercel over HTTPS. The Android APK/iOS builds and the offline-first (Airplane Mode) requirement have been dropped. Findings below that were originally recorded on a native Android device are rewritten to reflect the PWA; anything not yet verified in a browser is marked "to verify".

---

## Day 25 & 26 Verification Findings

### 1. Audio Playback (`src/services/audio.ts`)
- **Engine Selection:** Rather than using the slower, legacy `expo-av` module, SabiSpell uses Expo's imperative **`expo-audio`** engine (`createAudioPlayer`).
- **Caching Mechanism:** All system sound effects (correct pop, wrong, gangan drum, celebration) are pre-cached in memory (`playerCache`) upon game initialization.
- **Autoplay Policy:** Browsers block audio until a user gesture. Background music and sound effects start after the first user tap; audio initialisation is tied to that tap.
- **Latency:** The original native-device claim of 0ms latency no longer applies. Browser latency against the under-500ms PRD target: **to verify** in desktop and mobile Chrome.

### 2. Low-RAM Ankara Pattern Safety & Integration (`src/components/AnkaraTile.tsx` & `assets/patterns/ankara_tile.svg`)
- **Asset Size & Cleanliness:** The Ankara background tile `ankara_tile.svg` is audited at exactly **2.1 KB**, utilizing clean vector elements (`polygon`, `polyline`, `circle`) inside a `<pattern>` tag with no base64 embedded raster images.
- **Component Implementation:** Built a dedicated `<AnkaraTile />` React component inside `src/components/AnkaraTile.tsx` which replicates the clean SVG pattern structure efficiently.
- **Integration:** Integrated `<AnkaraTile />` as an absolute background layer at `8%` opacity inside `app/game/wazobia.tsx` for both the tongue selection view and active gameplay HUD.
- **Rendering:** `react-native-svg` renders the tile as lightweight vector paths (SVG in the browser on web). Rendering on a low-RAM phone's mobile browser without a blank screen: **to verify**.

### 3. Graduation Fanfare Trigger (`app/certificate.tsx`)
- **Mount Callback:** The Certificate screen imports `initAudio` and `playCelebration` from the audio service.
- **Fanfare Playback:** In `useEffect` on screen mount, the app starts the audio engine and triggers `playCelebration()`, which plays `graduation_fanfare.mp3` as the certificate and confetti render. Because of the browser autoplay policy, this relies on the user having already tapped in the session (they will have, to reach this screen). Playback in the browser: **to verify**.

### 4. Diacritic Keyboard Accents (`app/game/wazobia.tsx`)
- **Accent Toolbar:** The Wazobia Yoruba keyboard includes modifier buttons for acute (`◌́`) and grave (`◌̀`) accent marks.
- **Tone Mapper (`toneMap`):** The app maps Yoruba vowels to precomposed Unicode equivalents (e.g., `A` maps to `Á` or `À`, `Ẹ` maps to `Ẹ́` or `Ẹ̀`).
- **Tonal Toggle:** Typing a tone button updates the last vowel in the input buffer using `handleTonePress`. Typing the same modifier again toggles the diacritic off, reverting to the plain vowel. Underdots and case are correctly preserved.
- Behaviour with mobile browser on-screen keyboards: **to verify**.

### 5. PWA Compatibility (replaces the Airplane Mode / Offline-First Audit)
- **Offline requirement dropped:** The earlier audit claimed the app worked 100% in Airplane Mode. That requirement no longer applies: internet is required and there is no service worker. Airplane Mode is not a test target.
- **Word Banks:** The spelling curriculum data files (`sss_wordbank.json` and `yoruba_wordbank.json`) are bundled JSON and ship inside the web build.
- **Yoruba Audio:** The previous `FileSystem.documentDirectory` / `FileSystem.copyAsync` copy step is removed. The Yoruba mp3s are bundled and served as static assets over HTTPS, with `expo-speech` as the fallback. Loading and playback in the browser: **to verify**.
- **Persistence:** AsyncStorage maps to browser `localStorage`. Data is per-device and per-browser, is lost if browser data is cleared, and is not synced to any cloud. Survival across reload / browser restart: **to verify**.
- **Installability:** `public/manifest.json`, `public/index.html`, `public/icons/` and `app/+html.tsx` provide the PWA shell. Lighthouse PWA installable check and Add to Home screen on mobile Chrome: **to verify**.
- **Certificate Share:** `navigator.share` with the PNG file where supported, otherwise PNG download. Behaviour on target browsers: **to verify**.

---

## Day 27 Pitch Rehearsal Walkthrough

### 1. Graduation Exam Instant Unlock
- **Mechanism:** In `AppConfig.ts`, the derived graduation threshold function returns `5` in demo mode (`__DEMO_MODE__ = true`).
- **Demo Seed:** Since `DEMO_PROFILE` pre-seeds `word_history.sss` with 5 completed words (`sw_001`, `sw_002`, `sw_003`, `sw_007`, `sw_010`), the Graduation Exam is **unlocked and accessible immediately** on dashboard initialization without requiring grinding.

### 2. 7-Minute Pitch Walkthrough Simulation
We performed 3 complete dry runs of the pitch walkthrough script:
1. **Introduction (0:00 - 0:45):** Splash screen displays smoothly for 2 seconds. The Dashboard loads the Scholar status profile of `SpellChampion` with 6,420 XP and a 12-day streak.
2. **Adaptive Game Loop (0:45 - 2:00):** Tapped Academic League. Played a round with advanced WAEC vocabulary ("juxtaposition"). Confirmed correct answer triggers immediate +XP/coins and updates SSR.
3. **Yoruba Wazobia Mode (2:00 - 3:30):** Selected Yoruba Mode. Confirmed repeating Ankara background tile renders at 8% opacity. Tested typing "ìmọ̀" using the Diacritic Accent Toolbar. Submitting the correct word triggers a Gangan talking drum roll sound effect and displays the tied Yoruba proverb: *"Bí a bá ń sọ èdè wa, a ń pamọ́ ẹni tí a jẹ́."* (When we speak our language, we preserve who we are).
4. **SabiBot Arena (3:30 - 4:30):** Tapped Arena. Verified live progress bar update for both the user and the simulated opponent `SabiBot` (72% accuracy target).
5. **Graduation & Certificate (4:30 - 7:00):** Tapped Graduation. Answered the exam questions. On pass, the Certificate modal slides up, confetti animations rain down, and `graduation_fanfare.mp3` triggers. The "Share Certificate" button captures the SVG layout; it is now expected to open the browser share sheet via `navigator.share` (or download the PNG as a fallback). The earlier native share sheet result applied to the Android build and is superseded: re-run in the browser, **to verify**.

---

## Day 28 Web Build & Vercel Deploy

### 1. Build Configuration
- **Scripts:** `npm run web` for local development; `npm run build:web` (`expo export -p web`) produces the static site in `dist/`.
- **Hosting:** `vercel.json` provides an SPA rewrite so all routes resolve to `index.html`. Deployed on Vercel over HTTPS, which is required for PWA install and `navigator.share`.
- **Removed:** Android/iOS scripts and `eas.json`.

### 2. Deployment Status
- Production Vercel URL: **to verify** (record here once deployed).
- `dist/` size and cold load time on 4G: **to verify**.
- Lighthouse PWA installable result: **to verify**.

### 3. Superseded: EAS Native Builds
The earlier Android APK and iOS Simulator builds triggered through EAS (and their build links) belong to the native-app approach and are superseded by the PWA. They are intentionally not linked here.
