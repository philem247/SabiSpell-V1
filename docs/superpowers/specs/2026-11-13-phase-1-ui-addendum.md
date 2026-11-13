# Phase 1 UI addendum: design decisions, accessibility and economy rules

Date: 2026-11-13. Extends [Phase 1 spec](2026-11-13-phase-1-visual-refresh-design.md). Source: owner decisions, a design critique, a visual-consistency audit, a WCAG 2.2 AA design audit and an economy review. The Figma file "SabiSpell Design" (page Layouts) is the visual source of truth; this document is the behaviour and rules source of truth for the build plans 1c-A, 1c-B and 1c-C.

## 1. Product and copy rules

- UI says "Skill level" (never "SSR"). Code may keep `ssr` identifiers.
- Three different things, three words: **Title** = XP title (Recruit 0, Cadet 2,500, Scholar 8,000, Word Sage 20,000, VC's List 40,000); **Rank** = skill band; **Skill level** = the number (100 to 2000).
- Ranks: Fresher 100-299, Apprentice 300-599, Explorer 600-899, Speller 900-1199, Wordsmith 1200-1499, Linguist 1500-1799, Grandmaster 1800-2000.
- XP bar shows progress inside the current title band (for example 900 / 5,500 XP to Scholar).
- Bottom nav / side nav: Home, Collections, Profile. Settings via the dashboard and sidebar. A Help (?) button sits at the same top-right position on the dashboard, round, profile and settings.
- "Hint · 5 coins" shows its price; wrong answers pay no XP or coins ("No XP or coins this time").
- Collections: Classic and Yoruba open; Igbo and Hausa are "Free starter" (first 50 words free, full set Pro); Exam prep is Pro. Pro paywall screens are Phase 5.
- Shared device: "Not you?" link on the dashboard switches or starts a player. Optional PIN arrives with Phase 2 accounts.
- Graduation pays once per collection. Fail leads to a 24-hour cooldown.

## 2. Input rules

- Touch devices (`pointer: coarse`): on-screen keyboard only.
- Desktop (`pointer: fine` and `hover: hover`): letters may be typed on the physical keyboard through key handlers on the round (no `<input>`, so no paste, autocomplete, spellcheck or extensions). The on-screen keyboard stays visible and lights up as keys are pressed. If the first input event is touch, switch to touch mode.
- Yoruba `ẹ ọ ṣ` and the grave/acute tone keys are always clickable; tone keys apply to the last vowel. If there is no vowel, announce "No vowel to mark".
- Keys: Enter = Check, Backspace = delete, **Space = replay audio**, Esc = open the "Leave this round?" dialog, never close it silently. Plain letters are never shortcuts.
- Ignore key handlers when focus is in an input/textarea/select/contenteditable or when Ctrl, Alt or Meta is held. Prevent default for Backspace only inside the round.
- Settings toggle "Accessible input" (off by default) swaps in a real visually hidden `<input type="text" aria-label="Type the word you heard" autocomplete="off" autocorrect="off" spellcheck="false" autocapitalize="off">`, hides the on-screen keyboard from assistive technology, and normalises answers to NFC before comparing.
- Toggle "Word clue for deaf and hard-of-hearing players" shows a definition instead of relying on sound; it may affect ranking and says so.

## 3. Accessibility requirements (WCAG 2.2 AA)

Tokens
- `border-strong #7b8ea3` for input borders, empty letter slots, keyboard keys and the toggle off track. `border #dde6ef` is decoration only.
- Text colours: ink `#4a2c1f`, muted `#5a6b7b`, brand `#0a6ebd`, text-gold `#8a5a00`, success-text `#1f7a43`, danger-text `#b3261e`. Never use gold-400, gold-600, streak, success or danger tokens for text (2.7 to 4.4:1).
- Icons carrying meaning: streak `#b35a0a` or darker, success `#25824a` or darker.
- Minimum text 12px; primary content 16px. Use `rem`. No fixed heights or `white-space: nowrap` on buttons and chips (use `min-height`, allow wrapping; text spacing and Yoruba strings will lengthen labels).

Targets and reflow
- Minimum 44x44 hit area for close X, links, toggles (whole row), nav items. Keys 35x52 with a 4px padded hit area; never below 24px effective width at any zoom: keys `flex: 1 1 0; min-width: 24px`, wrap to two sub-rows below 360px width or high zoom.
- Letter slots shrink or wrap for words over 7 letters. Keyboard sits in layout flow or is sticky with `scroll-padding-bottom` equal to its height so focus is not obscured (2.4.11).

Focus
- `:focus-visible` ring: 2px white inner and 3px ink (`#4a2c1f`) outer, offset 2px, following the element radius; never clipped by `overflow: hidden`; `forced-colors: active` uses `outline: 3px solid CanvasText` and keeps real borders.
- Keyboard group is one Tab stop with roving tabindex (arrows, Home/End within a row, Enter/Space presses).
- Tab order in a round: Close, Help, Replay, Hint, keyboard, Backspace, Check. DOM order matches visual order.

Semantics
- Landmarks: `<header>`, `<nav aria-label="Main">` (links with `aria-current="page"`), `<main>`. One `h1` per screen; the round has a visually hidden h1 "Spelling round, word 4 of 10" plus visible "Word 4 of 10" and a progress bar.
- Keyboard: `role="group" aria-label="Spelling keyboard"`; each key a real `<button type="button">` named by its letter; Backspace "Delete last letter"; Check "Check answer"; Yoruba keys "dot below e", "dot below o", "dot below s", "grave tone mark", "acute tone mark".
- Letter slots: one group `aria-label="Your answer, 6 letters"` with the current answer as text; empty slots are not focusable. One persistent `role="status"` live region announces the typed letter or "deleted h"; a separate status announces the result. No double announcements when moving focus to the result heading.
- The masked blank in the context sentence is read as "blank", not underscores.
- Audio button: accessible name contains the visible text ("Play word again"); announce "Playing" via status; keep focus on the button.
- Energy pips: one `role="img"` "Energy 4 of 5"; bolts `aria-hidden`.
- Dialogs ("Leave this round?", energy): `<dialog>` or `role="dialog" aria-modal="true"` with labelled heading and described message, focus to the safe default ("Keep playing"), trap focus, `inert` background, Esc = safe action, return focus on close.
- Countdowns ("Next energy in 12:40"): no per-second `aria-live`; static text with a spoken-duration `aria-label`, refreshed at most per minute, plus a status "Energy is back".
- Username field: real `<label for>`, `autocomplete="username"`, `autocapitalize="none"`, `spellcheck="false"`, `enterkeyhint="go"`, inline error with `aria-describedby` and `aria-invalid`; allow paste.
- Mascot images are decorative (`alt=""`) unless they add information not in the headline.
- Wrong-answer screen exposes the correct word as one string, and "(-9)" reads "down 9".
- Visible labels are contained in accessible names (2.5.3): "Hint · 5 coins", "Check".

Audio
- The word is audio-only; provide: an audio-failed state in the speaker region ("Cannot play the sound." with Retry and Show clue), a clue option (definition) and the deaf/hard-of-hearing toggle above. The first word needs a user gesture (autoplay is blocked). Sound effects can be turned off; word audio in a round cannot.

Motion
- All animation inside `@media (prefers-reduced-motion: no-preference)`; plus an in-app "Reduce motion" setting. Animate `transform` and `opacity` only (mid-range Android); no flashing above 3 per second.
- Animate: key press (60 ms down), slot fill (120 ms pop), correct (staggered tile flip, 40 ms steps), wrong (300 ms shake, then reveal), XP/coins/skill count-up (600 ms), streak flame once, mascot pose swap (200 ms cross-fade), energy pip use/refill (250 ms), title promotion (800 ms), graduation confetti (at most 80 particles, 2 s, once), screen transitions (200-250 ms slide forward, fade for tab switches), desktop hover lift (120 ms).
- Do not animate: keyboard layout, sentence or slot geometry, countdown digits, the placement test, the mascot on round screens, anything looping, locked Pro cards.
- Reduced-motion fallbacks: instant state change with an icon or colour; no confetti; fade only.

Testing
- axe-core in CI. Manual: keyboard-only full round; NVDA + Firefox/Chrome; TalkBack + Chrome; VoiceOver iOS. 200% zoom and 320px width. `forced-colors`.

## 4. Economy rules (owner adopted; retune after playtests)

b = 5 + floor(skill / 200), the base coins per correct word at the player's level.
- Coin refill costs 8b (80 at skill 1100); max 2 per day, only when energy is 1 or less; the design shows a 30-coin placeholder.
- Hint costs max(3, round(0.6b)): about 6 Classic, 3 Yoruba (design shows 5). A hinted correct word pays half coins and XP, no streak or daily multiplier, skill change halved. Max 1 per word, 2 per round.
- Practise missed words: no energy, coins, XP, skill change, streak credit, daily claim or graduation progress. A word leaves the list on a correct answer; list capped at 50.
- Repeat words (already in history): coins, XP and skill change x0.25 (minimum 1 coin).
- Daily earn cap: 600 coins and 1,200 XP at full rate, then 25%. Graduation bonuses exempt but once only.
- Multipliers add instead of multiply: 1 + (streak - 1) + (daily - 1), capped at 2.0. Daily bonus is claimed once per local day (`last_daily_date`) on the daily-challenge words only.
- Graduation bonus (1,000 XP, 400 coins) once per collection (only if `graduations[id]` is unset); a failed exam has a 24-hour cooldown; unlocking counts distinct correct words only.
- Starter coins 100, once per account (flag survives `reset()`; weak without a server).
- Free streak freeze costs 150 coins (hold at most 2); Pro keeps one free per week.
- "Notify me when energy is back": use the `Notification` API now; real scheduled push needs the Phase 2 server.
- Known bugs to fix in plan 1c-A: `recordPlay` lowers `last_played_date` on a clock rewind (streak ratchet); `graduate()` overwrites without a guard; `addXPAndCoins` clamps coins at 0 so a short purchase can still be granted (add an atomic `spendCoins(n): boolean`); energy should be charged at round start, not on submit; `REWARD_MULTIPLIER_CAP` is dead code; `HINT_COST_COINS` is a flat 10; reward rounding inflates small values; cross-tab sync is missing.
- Server (Phase 2) only: authoritative time, `submit_round` validation, atomic refills, per-user per-day counters, rate limits.

## 5. States the build must cover

Loading skeletons; audio failed; offline banner; streak at risk; streak broken; empty new-user dashboard; username errors (taken, invalid, empty, Start disabled); insufficient coins for hint and refill; exam in progress, failed, passed; title promotion; load error. The Figma "States" section holds these frames.

## 6. Layout rules

- Mobile first. Tablet (768) widens the column and enlarges keys. Desktop (1280): left rail navigation replaces the bottom nav; round is two panels (sentence and slots left, keyboard and Check right); collections is a 3-column grid; profile is two columns.
- Use `pointer`/`hover` media queries for touch versus mouse behaviour, not width alone.
- Page tint (brand-50) is for desktop and tablet gutters; app background stays `#F6F9FD`.
- Top safe area: leave about 44px for status bars on installed PWAs.
