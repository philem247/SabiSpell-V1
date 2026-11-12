# SabiSpell

SabiSpell is an interactive, gamified adaptive spelling Progressive Web App (PWA) designed for Nigerian secondary school students (SSS 1–3). It maps directly to national curricula (WAEC, JAMB, NECO) and integrates localized cultural modules to improve spelling accuracy, vocabulary, and linguistic heritage.

---

## Key Features

- **Academic Spelling League:** Adaptive spelling matches aligned with SSS 1–3 syllabi. Tracks student performance using an ELO-based Skill Rating (SSR) engine.
- **Wazobia Native Spelling Mode:** Celebrates indigenous Nigerian languages. The Yoruba module challenges students to type native words containing complex tonal and underdot diacritics using a custom built-in Yoruba keyboard.
- **Scholar Profile Hub:** Displays title ranks (e.g., Recruit to Word Sage), daily streaks, SSR progress tracker, mastered word count, and Graduation Exam certificates.
- **Sabi Premium Shop:** Offers premium WAEC past question packs. Integrated with a simulated Paystack Sandbox checkout modal to demonstrate secure digital payments in Nigeria.
- **Investor Demo Mode:** Accessible via a hidden gesture (tapping the Àjàlá mascot 5 times on the dashboard), allowing quick state changes (max energy refills, XP adjustments, and instant graduation unlocks).

---

## Technical Stack & Tools

SabiSpell is built using a modern, lightweight web architecture, installable from the browser:

- **Frontend Core:** [React Native Web](https://necolas.github.io/react-native-web/) via [Expo](https://expo.dev/) with [Expo Router](https://docs.expo.dev/router/introduction/) for type-safe file-based navigation.
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) for centralizing player profiles, game states, energy systems, and coins.
- **Storage:** [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/), which maps to browser `localStorage` on web. Data is per-device and cleared if browser data is cleared; there is no cloud sync yet.
- **Audio Engine:** `expo-audio` (HTML audio on web) for feedback sound effects and pronunciation playbacks.

### Tool Credits & AI Integrations
- **YarnGPT (Yoruba Voice Synthesis):** The Wazobia Yoruba audio assets are programmatically synthesized using [YarnGPT's](https://yarngpt.ai) Yoruba natural voice model (*Femi*). This model ensures authentic accent tones (acute/grave) and proper vowel expressions, avoiding the robotic or anglicized pronunciations typical of generic TTS engines.
- **Paystack Checkout:** The premium shop implements a sandbox checkout sheet modeled after [Paystack's](https://paystack.com/) payment interfaces to represent local merchant integration.


## Run, Build & Deploy

```bash
npm install
npm run web          # dev server in the browser
npm run build:web    # static export to dist/
```

Deploy `dist/` to Vercel or Netlify (`vercel.json` rewrites all routes to `index.html`). HTTPS is required for the browser's "Install app" option.

---

## Directory Layout

```
SabiSpell/
├── app/                  # Expo Router file-based screens
│   ├── game/             # Active gameplay screens (Academic, Wazobia, Arena)
│   ├── +html.tsx         # Web root HTML (manifest link, theme color)
│   ├── _layout.tsx       # Root layout, loads fonts
│   ├── dashboard.tsx     # Home Dashboard HUD and Navigation
│   ├── profile.tsx       # Scholar Profile
│   └── shop.tsx          # Coin Exchange and Premium Packs Shop
├── public/               # PWA manifest.json and icons (copied into dist/)
├── assets/               # Local static images, fonts, and word audio banks
│   ├── audio/            # System sound effects and Yoruba word audio
│   ├── fonts/            # Space Grotesk, Inter, and Source Code Pro font files
│   └── wordbanks/        # Curriculum-mapped JSON spelling databases
├── src/                  # Core source code and utilities
│   ├── components/       # Reusable components (Energy bars, keyboards)
│   ├── constants/        # App configurations, colors, and dummy data
│   ├── services/         # Audio managers, diagnostic systems, and energy refills
│   └── store/            # Zustand global profile state
└── tsconfig.json         # TypeScript configurations
```

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
