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
