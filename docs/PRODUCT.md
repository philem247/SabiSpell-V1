# SabiSpell: Product Requirements

> Source of truth for the full product. Derived from the 2026-11-12 design spec (`docs/superpowers/specs/2026-11-12-full-product-design.md`).

## 1. Product definition

SabiSpell is a web app (PWA) for anyone who wants to spell and learn words better, playable in any modern browser. It evolves the SSS 2 hackathon MVP into a full product.

- **Audience:** everyone, levelled by skill. No school classes. Onboarding is a short placement round (the existing diagnostic).
- **Levelling:** the SSR/ELO engine places and tracks every player. Every word has an SSR.
- **Content:** skill bands plus topic collections: Everyday, Exams (WAEC/JAMB), Science, Business, and language collections (Yoruba now, Igbo and Hausa next). Some collections are free, some are Pro.
- **Modes:** Academic League becomes "Classic". Wazobia becomes a collection. Arena offers SabiBot (scaled to the player's SSR) or a real player; after about 12 s without a match it falls back to the bot. Bot results are labelled and count at reduced weight on leaderboards.
- **Economy:** XP titles, coins, energy, streaks, daily challenge and the graduation certificate stay. Graduation becomes a per-collection and per-band milestone instead of a per-class exam.
- **Money:** free core plus **SabiSpell Pro** on a Paystack subscription (unlimited energy, all collections, streak freeze, stats). No premium packs and no ads at launch. Coin top-ups and school licences are later options.
- **Brand:** name and Àjàlá mascot stay. New logo, app icon and mascot poses are generated with Ideogram (MCP connected). Layouts are redesigned in Figma (MCP connected).
- **Out of scope:** native Android/iOS apps and offline play. Capacitor is the escape hatch if native is wanted later.

## 2. Architecture

- **Client:** Vite + React + TypeScript + Tailwind. React Router. Zustand for state. `vite-plugin-pwa` for manifest and service worker. HTML Audio or Howler for sound. Web Speech API for TTS fallback. Static build hosted on Vercel.
- **Reused as-is:** the pure TypeScript logic (`ssr`, `economy`, `wordbank`, `energy`, `graduation`), the Zustand stores, word-bank JSON, audio, images and fonts.
- **Rewritten:** the UI layer (about 10 screens plus components), built from the Figma layouts directly on DOM and Tailwind.
- **Backend:** Supabase (auth, Postgres with row-level security, realtime, edge functions).
- **Auth:** guest-first with an anonymous Supabase session and no sign-up wall. Players can later attach email or Google login and keep their progress.
- **Data:** `profiles` (SSR, XP, coins, streak, title), `word_progress`, `entitlements` (Pro until a date), `payments`, `arena_matches`, `matchmaking_queue`, and a weekly leaderboard view.
- **Content delivery:** free collections ship as static JSON. Pro collections are served from Supabase behind an entitlement check, because bundled files cannot be gated.
- **Anti-cheat:** ranked results go through a server-side `submit_round` function that validates time and XP limits. It is a sanity check, not a fully server-run game.
- **Arena:** Supabase Realtime channels, matchmaking by SSR band, SabiBot stays client-side.
- **Payments (Paystack):** the client calls a `create-checkout` edge function (secret key stays server-side) to start a transaction on a plan. A `paystack-webhook` edge function verifies the `x-paystack-signature` HMAC-SHA512 and updates `entitlements`. The client is never trusted for Pro status.
- **Paystack pricing (from the pricing page):** local cards, USSD and bank 1.5% + ₦100 (₦100 waived under ₦2,500, capped at ₦2,000). International 3.9% + ₦100. Settlement T+1. Plan and subscription details are not yet verified and must be checked in the Paystack docs before Phase 5.
- **Rejected:** Bachs (no Naira auto-renew subscriptions, undocumented company and eligibility), Next.js rewrite, keeping Expo (native dropped, UI is being redesigned anyway).

## 3. Roadmap

Each phase gets its own spec, plan and build.

0. **Foundation:** scaffold the Vite app, port the logic layer and stores, remove SSS wording and tier gating, add the placement round and the collections concept. Rewrite the docs.
1. **Visual refresh:** Ideogram logo, icon and mascot poses. Figma layouts. Build the redesigned UI on the new stack.
2. **Backend foundation:** Supabase project, guest-to-account auth, profile and progress sync.
3. **Content:** collections schema, a general-vocabulary bank, Igbo and Hausa, an exam collection, and the audio generation pipeline (YarnGPT for the languages).
4. **Social:** weekly leaderboard, SSR-scaled SabiBot, then real-player Arena.
5. **Pro:** Paystack plan, `create-checkout` and webhook functions, entitlements, Pro collection gating.
6. **Launch hardening:** NDPR privacy and consent (including under-13 handling), analytics and error monitoring, Lighthouse, a landing page, a closed beta.

Order: 0, then 1 and 2 in parallel, then 3, 4, 5, 6. Phase 3 may overlap with 4.
