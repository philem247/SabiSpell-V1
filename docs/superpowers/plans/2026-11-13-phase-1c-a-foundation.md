# Phase 1c-A: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the router and layout shell, the accessible design-system component kit, the accessibility base (tokens, focus ring, reduced motion, live region) and the Phase 0 hand-off and economy logic fixes, so plans 1c-B (spelling round) and 1c-C (remaining screens) can build on a tested foundation.

**Architecture:** `react-router` v7 drives nine lightweight placeholder screens inside one `Shell` (header with Help slot, one responsive `<nav>` that is a bottom bar below 1024px and a left rail at 1024px and up, `<main>`, persistent live region). UI primitives live in `web/src/components/ui/` and share the Tailwind v4 `@theme` tokens in `index.css`. Economy rules become pure functions in `services/economy.ts`, `services/graduation.ts`, `services/streak.ts`, and the Zustand `profileStore` gains atomic actions (`spendCoins`, `startRound`, `refillWithCoins`, `applyRoundReward`, `completeGraduationExam`) plus a version-2 persist migration.

**Tech Stack:** Vite 8, React 19, TypeScript (strict), Tailwind v4 (`@tailwindcss/vite`, no config file), react-router 7, Hugeicons (`@hugeicons/react`, `@hugeicons/core-free-icons`), Zustand 5 persist, Vitest 5 + jsdom + Testing Library (+ user-event).

## Global Constraints

- All work is inside `C:\Users\hp\SabiSpell-V1\SabiSpell\web`. Paths below are relative to `web/` unless they start with `docs/` or `README.md` (repo root).
- No new dependencies beyond `react-router`, `@hugeicons/react`, `@hugeicons/core-free-icons`, and (dev) `@testing-library/user-event`.
- TypeScript strict. `npm run build` runs `tsc --noEmit && vite build`; it must keep emitting `dist/manifest.webmanifest` and `dist/sw.js`.
- Tests are colocated `*.test.ts` / `*.test.tsx` and import from `vitest` explicitly (the repo has no vitest globals). Keep every existing test green unless a task explicitly changes a behaviour and updates that test in the same task.
- Tailwind v4 only: tokens live in the `@theme` block of `src/index.css`. No `tailwind.config`. Use Tailwind's built-in `sr-only` as the visually-hidden utility.
- Light theme only. Mobile first. Breakpoints are Tailwind defaults: `md` 768px (tablet), `lg` 1024px (desktop rail).
- Sizes in `rem` (Tailwind spacing already is). Buttons and chips use `min-h-*`, never a fixed height or `whitespace-nowrap`.
- Every interactive element is keyboard operable with a visible focus ring. Minimum 44x44 CSS px hit area for icon buttons, nav items, toggles (whole row) and text buttons (`min-h-11`).
- UI copy says "Skill level" (never "SSR"). Code may keep `ssr` identifiers.
- Text colours: ink `#4a2c1f`, muted `#5a6b7b`, brand `#0a6ebd`, text-gold `#8a5a00`, success-text `#1f7a43`, danger-text `#b3261e`. Never use `gold-400`, `gold-600`, `success` or `danger` tokens for text.
- Never commit, stage or run git. Each task ends with a Checkpoint step: run the stated command, check the expected result, then the owner commits.
- Out of scope: spelling keyboard, letter slots, round screens (plan 1c-B); real screens, desktop layouts, legacy Expo app removal (plan 1c-C).

## File Structure

New files:
- `src/lib/cx.ts` class-name joiner.
- `src/components/ui/{Icon,Button,IconButton,TextButton,Chip,Badge,Card,EnergyPips,XPBar,Toggle,Banner,Modal,UsernameInput}.tsx` plus colocated tests.
- `src/components/LiveRegion.tsx`, `src/hooks/useAnnounce.ts`, `src/hooks/useReducedMotion.ts`, `src/hooks/useRouteFocus.ts`.
- `src/components/SkipLink.tsx`, `src/components/nav/MainNav.tsx`.
- `src/app/{AppRoutes,Shell,RequireOnboarded}.tsx`, `src/app/PlaceholderScreen.tsx`.
- `src/store/settingsStore.ts`, `src/store/safeStorage.ts`, `src/store/migrate.ts`, `src/store/crossTab.ts`.
- `src/services/starter.ts`.
- `vercel.json` (in `web/`).

Modified: `src/index.css`, `src/test-setup.ts`, `src/config.ts`, `src/App.tsx`, `src/main.tsx`, `src/services/{economy,streak,titles,graduation,wordbank}.ts`, `src/store/profileStore.ts`, existing tests named in each task, `README.md` (repo root).

## Final Profile shape (reference for all economy tasks)

```ts
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
  // new in version 2
  graduation_fail_ts: Partial<Record<CollectionId, number>>; // ms timestamp of last failed exam
  refill_count: number;      // coin refills used on refill_date
  refill_date: string;       // local ISO date of refill_count
  last_daily_date: string;   // local ISO date the daily bonus was last claimed
  daily_earned: { coins: number; xp: number }; // earned on daily_date
  daily_date: string;        // local ISO date of daily_earned
}
```

---

## Phase A: Accessibility base and design system

### Task 1: Tokens, focus ring, motion CSS, test setup

**Files:**
- Modify: `src/index.css`
- Modify: `src/test-setup.ts`
- Create: `src/lib/cx.ts`
- Test: `src/index.css.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: Tailwind colour utilities `border-border`, `border-border-strong`, `bg-page-tint`, `text-muted`, `text-text-gold`, `text-success-text`, `text-danger-text`, `text-streak`, `bg-danger-50`; global `:focus-visible` ring; CSS var `--motion-scale`; `html[data-reduce-motion="true"]` rule; `cx(...parts: (string | false | null | undefined)[]): string`; test setup that auto-cleans Testing Library renders and stubs `window.matchMedia`.

- [ ] **Step 1: Write the failing test**

Create `src/index.css.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import css from './index.css?raw';

describe('index.css accessibility base', () => {
  it('defines the new colour tokens with the addendum values', () => {
    for (const token of [
      '--color-border: #dde6ef',
      '--color-border-strong: #7b8ea3',
      '--color-page-tint: #eaf4fc',
      '--color-muted: #5a6b7b',
      '--color-text-gold: #8a5a00',
      '--color-success-text: #1f7a43',
      '--color-danger-text: #b3261e',
      '--color-streak: #b35a0a',
      '--color-danger-50: #fdecea',
    ]) {
      expect(css).toContain(token);
    }
  });

  it('has a global focus ring with a forced-colors fallback', () => {
    expect(css).toContain(':focus-visible');
    expect(css).toContain('3px solid var(--color-ink)');
    expect(css).toContain('0 0 0 2px #fff');
    expect(css).toContain('@media (forced-colors: active)');
    expect(css).toContain('3px solid CanvasText');
  });

  it('handles reduced motion from the OS and from the in-app flag', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain(':root[data-reduce-motion="true"]');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/index.css.test.ts`
Expected: FAIL (`expected '...' to contain '--color-border: #dde6ef'`).

- [ ] **Step 3: Implement**

In `src/index.css`, add these lines inside the existing `@theme { ... }` block, right after `--color-background: #f6f9fd;`:

```css
  --color-border: #dde6ef;
  --color-border-strong: #7b8ea3;
  --color-page-tint: #eaf4fc;
  --color-muted: #5a6b7b;
  --color-text-gold: #8a5a00;
  --color-success-text: #1f7a43;
  --color-danger-text: #b3261e;
  --color-streak: #b35a0a;
  --color-danger-50: #fdecea;
```

Append after the existing `body { ... }` rule:

```css
html {
  font-size: 100%;
  /* Keeps focused elements clear of the sticky bottom nav (WCAG 2.4.11). */
  scroll-padding-bottom: 6rem;
}

/* Focus ring: 2px white inner, 3px ink outer, 2px offset. Follows the element radius. */
:focus-visible {
  outline: 3px solid var(--color-ink);
  outline-offset: 2px;
  box-shadow: 0 0 0 2px #fff;
}

@media (forced-colors: active) {
  :focus-visible {
    outline: 3px solid CanvasText;
    box-shadow: none;
  }
}

/* Motion: 1 means animate, 0 means do not. Components read this through useReducedMotion. */
:root {
  --motion-scale: 1;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-scale: 0;
  }
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

:root[data-reduce-motion="true"] {
  --motion-scale: 0;
}

:root[data-reduce-motion="true"] *,
:root[data-reduce-motion="true"] *::before,
:root[data-reduce-motion="true"] *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}
```

Create `src/lib/cx.ts`:

```ts
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
```

Replace `src/test-setup.ts` with:

```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest has no globals here, so Testing Library cannot register its own cleanup.
afterEach(cleanup);

// jsdom has no matchMedia. Default to "nothing matches"; tests override it when needed.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run`
Expected: PASS (the new file plus all existing tests).

- [ ] **Step 5: Checkpoint**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all tests pass, no type errors. Then the owner commits.

---

### Task 2: Install dependencies and the Icon component

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm)
- Create: `src/components/ui/Icon.tsx`
- Test: `src/components/ui/Icon.test.tsx`

**Interfaces:**
- Consumes: `cx` not needed.
- Produces: `type IconName`, `const ICONS`, and default export `Icon({ name, size?, className?, label? })`. Decorative by default (`aria-hidden`); with `label` it becomes `role="img"` with `aria-label`.

Verified in the installed package `@hugeicons/core-free-icons@4.4.0` (Stroke Rounded, `.d.ts` files inspected). Mapping:

| Semantic name | Hugeicons export | Note |
|---|---|---|
| flame | `FireIcon` | `FlameIcon` also exists; `FireIcon` reads as streak fire |
| coin | `Coins01Icon` | |
| bolt | `BoltIcon` | energy; `FlashIcon` and `ZapIcon` also exist |
| speaker | `VolumeHighIcon` | |
| lock | `LockIcon` | |
| help | `HelpCircleIcon` | `QuestionIcon` also exists |
| home | `Home01Icon` | |
| collections | `GridViewIcon` | |
| profile | `UserIcon` | |
| settings | `Settings01Icon` | |
| close | `Cancel01Icon` | |
| cross | `Cancel01Icon` | same glyph as close |
| check | `Tick02Icon` | |
| star | `StarIcon` | |
| backspace | `ArrowLeft01Icon` | **MISSING**: no backspace glyph exists in the free set (only trash-style `Delete0xIcon`). Fallback is a left arrow; the button that uses it is named "Delete last letter", so the icon stays decorative. |

- [ ] **Step 1: Install**

Run:
```
npm install react-router@^7.18.5 @hugeicons/react @hugeicons/core-free-icons
npm install -D @testing-library/user-event
```
Expected: installs without peer errors (react 19). If `npm` reports a peer conflict, re-run with the existing `legacy-peer-deps` setting (`web/.npmrc`) already in place; do not add other packages.

- [ ] **Step 2: Write the failing test**

Create `src/components/ui/Icon.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Icon, { ICONS, type IconName } from './Icon';

describe('Icon', () => {
  it('maps every semantic name to a real Hugeicons icon', () => {
    const names = Object.keys(ICONS) as IconName[];
    expect(names).toEqual(
      expect.arrayContaining([
        'flame', 'coin', 'bolt', 'speaker', 'lock', 'help', 'home', 'collections',
        'profile', 'settings', 'close', 'backspace', 'check', 'cross', 'star',
      ]),
    );
    for (const name of names) expect(Array.isArray(ICONS[name])).toBe(true);
  });

  it('is decorative by default', () => {
    const { container } = render(<Icon name="flame" />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('exposes a label when given one', () => {
    render(<Icon name="lock" label="Locked" />);
    expect(screen.getByRole('img', { name: 'Locked' })).toBeInTheDocument();
  });

  it('applies size', () => {
    const { container } = render(<Icon name="coin" size={32} />);
    expect(container.querySelector('svg')).toHaveAttribute('width', '32');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/ui/Icon.test.tsx`
Expected: FAIL (cannot resolve `./Icon`).

- [ ] **Step 4: Implement**

Create `src/components/ui/Icon.tsx`:

```tsx
import {
  ArrowLeft01Icon,
  BoltIcon,
  Cancel01Icon,
  Coins01Icon,
  FireIcon,
  GridViewIcon,
  HelpCircleIcon,
  Home01Icon,
  LockIcon,
  Settings01Icon,
  StarIcon,
  Tick02Icon,
  UserIcon,
  VolumeHighIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';

// The core package types icons as IconSvgObject; the renderer wants IconSvgElement. Same runtime shape.
const el = (icon: unknown) => icon as IconSvgElement;

export const ICONS = {
  flame: el(FireIcon),
  coin: el(Coins01Icon),
  bolt: el(BoltIcon),
  speaker: el(VolumeHighIcon),
  lock: el(LockIcon),
  help: el(HelpCircleIcon),
  home: el(Home01Icon),
  collections: el(GridViewIcon),
  profile: el(UserIcon),
  settings: el(Settings01Icon),
  close: el(Cancel01Icon),
  cross: el(Cancel01Icon),
  check: el(Tick02Icon),
  star: el(StarIcon),
  // No backspace glyph in the free set: left arrow stands in. Buttons using it carry their own accessible name.
  backspace: el(ArrowLeft01Icon),
} as const;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  /** Provide only when the icon carries meaning on its own. */
  label?: string;
}

export default function Icon({ name, size = 24, className, label }: IconProps) {
  return (
    <HugeiconsIcon
      icon={ICONS[name]}
      size={size}
      className={className}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true, focusable: false })}
    />
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/ui/Icon.test.tsx && npx tsc --noEmit`
Expected: PASS, no type errors. If tsc rejects a named import, run `node -e "import('@hugeicons/core-free-icons').then(m=>console.log(Object.keys(m).filter(k=>/Fire|Coins01|Bolt|VolumeHigh|Lock|HelpCircle|Home01|GridView|User|Settings01|Cancel01|Tick02|Star|ArrowLeft01/.test(k)).slice(0,40)))"` and correct the name; report the change.

- [ ] **Step 6: Checkpoint**

Run: `npx vitest run`
Expected: all green. Then the owner commits.

---

### Task 3: Reduced-motion setting and hook

**Files:**
- Modify: `src/config.ts` (add `SETTINGS` storage key)
- Create: `src/store/settingsStore.ts`, `src/hooks/useReducedMotion.ts`
- Test: `src/hooks/useReducedMotion.test.ts`

**Interfaces:**
- Consumes: `Config.STORAGE_KEYS`.
- Produces: `useSettingsStore` with `{ reduceMotion: boolean; setReduceMotion(v: boolean): void }`; `useReducedMotion(): boolean` (true when the OS asks for reduced motion OR the in-app flag is on; also sets `document.documentElement.dataset.reduceMotion`).

- [ ] **Step 1: Write the failing test**

Create `src/hooks/useReducedMotion.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useSettingsStore } from '../store/settingsStore';
import { useReducedMotion } from './useReducedMotion';

const realMatchMedia = window.matchMedia;

function mockOsPreference(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState({ reduceMotion: false });
});

afterEach(() => {
  window.matchMedia = realMatchMedia;
  delete document.documentElement.dataset.reduceMotion;
});

describe('useReducedMotion', () => {
  it('is false when neither the OS nor the app asks for it', () => {
    mockOsPreference(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    expect(document.documentElement.dataset.reduceMotion).toBe('false');
  });

  it('is true when the OS asks for it', () => {
    mockOsPreference(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
    expect(document.documentElement.dataset.reduceMotion).toBe('true');
  });

  it('is true when the in-app flag is on', () => {
    mockOsPreference(false);
    const { result } = renderHook(() => useReducedMotion());
    act(() => useSettingsStore.getState().setReduceMotion(true));
    expect(result.current).toBe(true);
    expect(document.documentElement.dataset.reduceMotion).toBe('true');
  });

  it('persists the flag', () => {
    useSettingsStore.getState().setReduceMotion(true);
    const saved = JSON.parse(localStorage.getItem('sabispell:settings')!);
    expect(saved.state.reduceMotion).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useReducedMotion.test.ts`
Expected: FAIL (cannot resolve `../store/settingsStore`).

- [ ] **Step 3: Implement**

In `src/config.ts` replace `STORAGE_KEYS: { PROFILE: 'sabispell:profile' },` with:

```ts
  STORAGE_KEYS: { PROFILE: 'sabispell:profile', SETTINGS: 'sabispell:settings' },
```

Create `src/store/settingsStore.ts`:

```ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Config } from '../config';

interface SettingsState {
  reduceMotion: boolean;
  setReduceMotion(value: boolean): void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      reduceMotion: false,
      setReduceMotion: (value) => set({ reduceMotion: value }),
    }),
    {
      name: Config.STORAGE_KEYS.SETTINGS,
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
```

Create `src/hooks/useReducedMotion.ts`:

```ts
import { useEffect, useSyncExternalStore } from 'react';
import { useSettingsStore } from '../store/settingsStore';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

const osPrefersReduced = () =>
  typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches;

/** True when the OS or the in-app "Reduce motion" setting asks for less motion. Also mirrors the result onto <html data-reduce-motion>. */
export function useReducedMotion(): boolean {
  const os = useSyncExternalStore(subscribe, osPrefersReduced, () => false);
  const flag = useSettingsStore((s) => s.reduceMotion);
  const reduce = os || flag;
  useEffect(() => {
    document.documentElement.dataset.reduceMotion = String(reduce);
  }, [reduce]);
  return reduce;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/useReducedMotion.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Checkpoint**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all green. Then the owner commits.

---

### Task 4: Live region and useAnnounce

**Files:**
- Create: `src/hooks/useAnnounce.ts`, `src/components/LiveRegion.tsx`
- Test: `src/components/LiveRegion.test.tsx`

**Interfaces:**
- Produces: `useLiveStore` (`{ message: string; tick: number; announce(message: string): void }`), `useAnnounce(): (message: string) => void`, default export `LiveRegion()` rendering one persistent `role="status"` polite region. Announcing the same message twice re-announces it.

- [ ] **Step 1: Write the failing test**

Create `src/components/LiveRegion.test.tsx`:

```tsx
import { act, render, renderHook, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAnnounce, useLiveStore } from '../hooks/useAnnounce';
import LiveRegion from './LiveRegion';

beforeEach(() => useLiveStore.setState({ message: '', tick: 0 }));

describe('LiveRegion', () => {
  it('is a polite status region, visually hidden', () => {
    render(<LiveRegion />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveClass('sr-only');
  });

  it('shows announced messages', () => {
    render(<LiveRegion />);
    const { result } = renderHook(() => useAnnounce());
    act(() => result.current('Energy is back'));
    expect(screen.getByRole('status')).toHaveTextContent('Energy is back');
  });

  it('changes the DOM text when the same message repeats so it is spoken again', () => {
    render(<LiveRegion />);
    const { result } = renderHook(() => useAnnounce());
    act(() => result.current('Playing'));
    const first = screen.getByRole('status').textContent;
    act(() => result.current('Playing'));
    expect(screen.getByRole('status').textContent).not.toBe(first);
    expect(screen.getByRole('status')).toHaveTextContent('Playing');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/LiveRegion.test.tsx`
Expected: FAIL (cannot resolve `../hooks/useAnnounce`).

- [ ] **Step 3: Implement**

Create `src/hooks/useAnnounce.ts`:

```ts
import { create } from 'zustand';

interface LiveState {
  message: string;
  tick: number;
  announce(message: string): void;
}

export const useLiveStore = create<LiveState>((set) => ({
  message: '',
  tick: 0,
  announce: (message) => set((s) => ({ message, tick: s.tick + 1 })),
}));

export function useAnnounce(): (message: string) => void {
  return useLiveStore((s) => s.announce);
}
```

Create `src/components/LiveRegion.tsx`:

```tsx
import { useLiveStore } from '../hooks/useAnnounce';

/** Mount once in the shell. Must stay in the DOM so screen readers register it before the first message. */
export default function LiveRegion() {
  const message = useLiveStore((s) => s.message);
  const tick = useLiveStore((s) => s.tick);
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
      {/* Zero-width space on odd ticks so an identical message still changes the text node. */}
      {tick % 2 === 1 ? '\u200B' : ''}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/LiveRegion.test.tsx`
Expected: PASS (3 tests). Note: first announce has tick 1 (odd) so a zero-width space is appended; the second has tick 2 (none), so the text differs.

- [ ] **Step 5: Checkpoint**

Run: `npx vitest run`
Expected: all green. Then the owner commits.

---

### Task 5: Button, IconButton, TextButton

**Files:**
- Create: `src/components/ui/Button.tsx`, `src/components/ui/IconButton.tsx`, `src/components/ui/TextButton.tsx`
- Test: `src/components/ui/Buttons.test.tsx`

**Interfaces:**
- Consumes: `cx` (`src/lib/cx.ts`), `Icon`/`IconName` (`./Icon`).
- Produces:
  - `Button` props: `ButtonHTMLAttributes<HTMLButtonElement>` plus either `{ variant?: 'primary' | 'secondary' }` or `{ variant: 'hint'; price: number }` (hint renders "Hint · {price} coins").
  - `IconButton({ icon: IconName; label: string } & ButtonHTMLAttributes)`: 44px hit area, `aria-label={label}`.
  - `TextButton(ButtonHTMLAttributes)`: `min-h-11` link-style button.

- [ ] **Step 1: Write the failing test**

Create `src/components/ui/Buttons.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Button from './Button';
import IconButton from './IconButton';
import TextButton from './TextButton';

describe('Button', () => {
  it('renders a primary button of type button by default and fires onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Check</Button>);
    const btn = screen.getByRole('button', { name: 'Check' });
    expect(btn).toHaveAttribute('type', 'button');
    await userEvent.setup().click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('uses min-height, never a fixed height', () => {
    render(<Button variant="secondary">Back</Button>);
    const cls = screen.getByRole('button', { name: 'Back' }).className;
    expect(cls).toContain('min-h-12');
    expect(cls).not.toMatch(/\bh-\d/);
    expect(cls).not.toContain('whitespace-nowrap');
  });

  it('can be disabled', async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Check</Button>);
    const btn = screen.getByRole('button', { name: 'Check' });
    expect(btn).toBeDisabled();
    await userEvent.setup().click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('hint variant shows its coin price in the accessible name', () => {
    render(<Button variant="hint" price={5} />);
    expect(screen.getByRole('button', { name: 'Hint · 5 coins' })).toBeInTheDocument();
  });
});

describe('IconButton', () => {
  it('is named by its label and has a 44px hit area', () => {
    render(<IconButton icon="close" label="Close" />);
    const btn = screen.getByRole('button', { name: 'Close' });
    expect(btn.className).toContain('size-11');
  });
});

describe('TextButton', () => {
  it('has a 44px minimum height', () => {
    render(<TextButton>Not you?</TextButton>);
    expect(screen.getByRole('button', { name: 'Not you?' }).className).toContain('min-h-11');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/Buttons.test.tsx`
Expected: FAIL (cannot resolve `./Button`).

- [ ] **Step 3: Implement**

Create `src/components/ui/Button.tsx`:

```tsx
import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import Icon from './Icon';

type BaseProps = ButtonHTMLAttributes<HTMLButtonElement>;
export type ButtonProps =
  | (BaseProps & { variant?: 'primary' | 'secondary' })
  | (Omit<BaseProps, 'children'> & { variant: 'hint'; price: number });

const BASE =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-2 text-base font-extrabold transition-transform duration-100 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none';

const VARIANT = {
  primary: 'bg-brand-600 text-white shadow-chunky',
  secondary: 'border-2 border-border-strong bg-surface text-brand-700',
  hint: 'border-2 border-gold-600 bg-gold-100 text-text-gold',
} as const;

export default function Button(props: ButtonProps) {
  const { variant = 'primary', className, type = 'button', ...rest } = props as BaseProps & {
    variant?: keyof typeof VARIANT;
    price?: number;
  };
  const { price, children, ...domProps } = rest as BaseProps & { price?: number };
  return (
    <button type={type} className={cx(BASE, VARIANT[variant], className)} {...domProps}>
      {variant === 'hint' ? (
        <>
          <Icon name="coin" size={18} />
          {`Hint · ${price} coins`}
        </>
      ) : (
        children
      )}
    </button>
  );
}
```

Create `src/components/ui/IconButton.tsx`:

```tsx
import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import Icon, { type IconName } from './Icon';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {
  icon: IconName;
  label: string;
}

export default function IconButton({ icon, label, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cx(
        'inline-grid size-11 place-items-center rounded-full text-brand-700 hover:bg-brand-50 disabled:opacity-60',
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={24} />
    </button>
  );
}
```

Create `src/components/ui/TextButton.tsx`:

```tsx
import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';

export default function TextButton({ className, type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cx('inline-flex min-h-11 items-center px-2 text-base font-bold text-brand-700 underline underline-offset-4', className)}
      {...rest}
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ui/Buttons.test.tsx && npx tsc --noEmit`
Expected: PASS (6 tests), no type errors.

- [ ] **Step 5: Checkpoint**

Run: `npx vitest run`
Expected: all green. Then the owner commits.

---

### Task 6: Chip, Badge, Card

**Files:**
- Create: `src/components/ui/Chip.tsx`, `src/components/ui/Badge.tsx`, `src/components/ui/Card.tsx`
- Test: `src/components/ui/Display.test.tsx`

**Interfaces:**
- Consumes: `cx`, `Icon`.
- Produces:
  - `Chip({ variant: 'coins' | 'xp' | 'streak' | 'energy' | 'skill' | 'streak-risk'; value: string | number; className? })`. Includes visually hidden label text (for example "Coins: 120"). Wraps, never `whitespace-nowrap`.
  - `Badge({ kind: 'free-starter' | 'pro' })` text "Free starter" or "Pro".
  - `Card({ as?: 'div' | 'section' | 'li' | 'article'; className?; children })`.

- [ ] **Step 1: Write the failing test**

Create `src/components/ui/Display.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Badge from './Badge';
import Card from './Card';
import Chip from './Chip';

describe('Chip', () => {
  it.each([
    ['coins', 120, 'Coins: 120'],
    ['xp', '1,200', 'XP: 1,200'],
    ['streak', 4, 'Day streak: 4'],
    ['energy', '3/5', 'Energy: 3/5'],
    ['skill', 1100, 'Skill level: 1100'],
    ['streak-risk', 'Play today', 'Streak at risk: Play today'],
  ] as const)('%s chip reads as "%s"', (variant, value, text) => {
    render(<Chip variant={variant} value={value} />);
    expect(screen.getByTestId('chip')).toHaveTextContent(text);
  });

  it('never forbids wrapping', () => {
    render(<Chip variant="coins" value={5} />);
    expect(screen.getByTestId('chip').className).not.toContain('whitespace-nowrap');
  });

  it('hides decorative icons from assistive tech', () => {
    const { container } = render(<Chip variant="streak" value={2} />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('Badge', () => {
  it('renders the two kinds', () => {
    render(
      <>
        <Badge kind="free-starter" />
        <Badge kind="pro" />
      </>,
    );
    expect(screen.getByText('Free starter')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });
});

describe('Card', () => {
  it('renders children in a div by default', () => {
    render(<Card>Hello</Card>);
    expect(screen.getByText('Hello').tagName).toBe('DIV');
  });
  it('can render as another element', () => {
    render(<Card as="section">Hi</Card>);
    expect(screen.getByText('Hi').tagName).toBe('SECTION');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/Display.test.tsx`
Expected: FAIL (cannot resolve `./Badge`).

- [ ] **Step 3: Implement**

Create `src/components/ui/Chip.tsx`:

```tsx
import { cx } from '../../lib/cx';
import Icon, { type IconName } from './Icon';

export type ChipVariant = 'coins' | 'xp' | 'streak' | 'energy' | 'skill' | 'streak-risk';

const CHIPS: Record<ChipVariant, { label: string; icon?: IconName; tone: string; iconTone: string }> = {
  coins: { label: 'Coins', icon: 'coin', tone: 'bg-gold-100 text-text-gold', iconTone: 'text-text-gold' },
  xp: { label: 'XP', icon: 'star', tone: 'bg-gold-100 text-text-gold', iconTone: 'text-text-gold' },
  streak: { label: 'Day streak', icon: 'flame', tone: 'bg-orange-50 text-ink', iconTone: 'text-streak' },
  energy: { label: 'Energy', icon: 'bolt', tone: 'bg-brand-50 text-ink', iconTone: 'text-brand-700' },
  skill: { label: 'Skill level', tone: 'bg-brand-50 text-brand-800', iconTone: '' },
  'streak-risk': { label: 'Streak at risk', icon: 'flame', tone: 'bg-danger-50 text-danger-text', iconTone: 'text-danger-text' },
};

export default function Chip({
  variant,
  value,
  className,
}: {
  variant: ChipVariant;
  value: string | number;
  className?: string;
}) {
  const c = CHIPS[variant];
  return (
    <span
      data-testid="chip"
      className={cx('inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold', c.tone, className)}
    >
      {c.icon && <Icon name={c.icon} size={16} className={c.iconTone} />}
      <span className="sr-only">{c.label}: </span>
      {value}
    </span>
  );
}
```

Create `src/components/ui/Badge.tsx`:

```tsx
const BADGES = {
  'free-starter': { text: 'Free starter', tone: 'bg-[#e3f4ea] text-success-text' },
  pro: { text: 'Pro', tone: 'bg-gold-100 text-text-gold' },
} as const;

export default function Badge({ kind }: { kind: keyof typeof BADGES }) {
  const b = BADGES[kind];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-extrabold ${b.tone}`}>{b.text}</span>;
}
```

Create `src/components/ui/Card.tsx`:

```tsx
import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';

type CardTag = 'div' | 'section' | 'li' | 'article';

export default function Card({
  as: Tag = 'div',
  className,
  children,
}: {
  as?: CardTag;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={cx('rounded-2xl border border-border bg-surface p-4 shadow-chunky', className)}>{children}</Tag>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ui/Display.test.tsx && npx tsc --noEmit`
Expected: PASS (11 tests).

- [ ] **Step 5: Checkpoint**

Run: `npx vitest run`
Expected: all green. Then the owner commits.

---

### Task 7: EnergyPips, XPBar and title progress

**Files:**
- Modify: `src/services/titles.ts`, `src/services/titles.test.ts`
- Create: `src/components/ui/EnergyPips.tsx`, `src/components/ui/XPBar.tsx`
- Test: `src/components/ui/Meters.test.tsx`

**Interfaces:**
- Consumes: `Config.ENERGY_CAP`, `Config.XP_TITLES`, `Icon`.
- Produces:
  - `getTitleProgress(xp: number): { title: string; nextTitle: string | null; current: number; span: number; fraction: number }` in `titles.ts` (progress inside the current title band; top title gives `span 0, fraction 1, nextTitle null`).
  - `EnergyPips({ energy: number; cap?: number })`: one `role="img"` named "Energy N of M", bolts aria-hidden, empty pips outline only, visible count text "N/M" (aria-hidden).
  - `XPBar({ xp: number })`: `role="progressbar"` with text "900 / 5,500 XP to Scholar"; fill width is a percentage rounded to one decimal.

- [ ] **Step 1: Write the failing tests**

Append to `src/services/titles.test.ts` (keep the file's existing imports; add `getTitleProgress` to the import from `./titles`):

```ts
describe('getTitleProgress', () => {
  it('measures progress inside the current title band', () => {
    expect(getTitleProgress(3400)).toEqual({
      title: 'Cadet',
      nextTitle: 'Scholar',
      current: 900,
      span: 5500,
      fraction: 900 / 5500,
    });
  });
  it('starts at zero for a new player', () => {
    expect(getTitleProgress(0)).toMatchObject({ title: 'Recruit', nextTitle: 'Cadet', current: 0, span: 2500, fraction: 0 });
  });
  it('is full at the top title', () => {
    expect(getTitleProgress(45000)).toEqual({ title: "VC's List", nextTitle: null, current: 5000, span: 0, fraction: 1 });
  });
  it('treats negative XP as zero', () => {
    expect(getTitleProgress(-5).current).toBe(0);
  });
});
```

If `titles.test.ts` has no `describe` import, add `describe` to its vitest import.

Create `src/components/ui/Meters.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EnergyPips from './EnergyPips';
import XPBar from './XPBar';

describe('EnergyPips', () => {
  it('is one image named by the count', () => {
    render(<EnergyPips energy={4} />);
    expect(screen.getByRole('img', { name: 'Energy 4 of 5' })).toBeInTheDocument();
  });
  it('shows the count as text and draws empty pips as outlines only', () => {
    const { container } = render(<EnergyPips energy={2} />);
    expect(screen.getByText('2/5')).toBeInTheDocument();
    expect(container.querySelectorAll('svg')).toHaveLength(2);
    expect(container.querySelectorAll('[data-pip="empty"]')).toHaveLength(3);
    expect(container.querySelector('[data-pip="empty"]')!.className).toContain('border-2');
  });
  it('clamps out-of-range values', () => {
    render(<EnergyPips energy={9} />);
    expect(screen.getByRole('img', { name: 'Energy 5 of 5' })).toBeInTheDocument();
  });
});

describe('XPBar', () => {
  it('shows progress inside the current title band', () => {
    render(<XPBar xp={3400} />);
    expect(screen.getByText('900 / 5,500 XP to Scholar')).toBeInTheDocument();
    const bar = screen.getByRole('progressbar', { name: 'XP progress' });
    expect(bar).toHaveAttribute('aria-valuenow', '900');
    expect(bar).toHaveAttribute('aria-valuemax', '5500');
    expect(screen.getByTestId('xp-fill')).toHaveStyle({ width: '16.4%' });
  });
  it('is full and says so at the top title', () => {
    render(<XPBar xp={45000} />);
    expect(screen.getByText('Top title reached')).toBeInTheDocument();
    expect(screen.getByTestId('xp-fill')).toHaveStyle({ width: '100%' });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/services/titles.test.ts src/components/ui/Meters.test.tsx`
Expected: FAIL (`getTitleProgress` is not exported; cannot resolve `./EnergyPips`).

- [ ] **Step 3: Implement**

Append to `src/services/titles.ts`:

```ts
export interface TitleProgress {
  title: string;
  nextTitle: string | null;
  current: number;
  span: number;
  fraction: number;
}

export function getTitleProgress(xp: number): TitleProgress {
  const safe = Math.max(0, xp);
  const titles = Config.XP_TITLES;
  let i = 0;
  titles.forEach((t, idx) => {
    if (safe >= t.minXP) i = idx;
  });
  const band = titles[i];
  const next = titles[i + 1];
  const current = safe - band.minXP;
  if (!next) return { title: band.name, nextTitle: null, current, span: 0, fraction: 1 };
  const span = next.minXP - band.minXP;
  return { title: band.name, nextTitle: next.name, current, span, fraction: current / span };
}
```

Create `src/components/ui/EnergyPips.tsx`:

```tsx
import { Config } from '../../config';
import Icon from './Icon';

export default function EnergyPips({ energy, cap = Config.ENERGY_CAP }: { energy: number; cap?: number }) {
  const n = Math.max(0, Math.min(cap, Math.floor(energy)));
  return (
    <span className="inline-flex items-center gap-2">
      <span role="img" aria-label={`Energy ${n} of ${cap}`} className="flex gap-1">
        {Array.from({ length: cap }, (_, i) =>
          i < n ? (
            <span key={i} data-pip="full" className="grid size-6 place-items-center rounded-full bg-gold-400 text-ink">
              <Icon name="bolt" size={14} />
            </span>
          ) : (
            <span key={i} data-pip="empty" className="size-6 rounded-full border-2 border-border-strong bg-transparent" />
          ),
        )}
      </span>
      <span aria-hidden="true" className="text-sm font-bold">
        {n}/{cap}
      </span>
    </span>
  );
}
```

Create `src/components/ui/XPBar.tsx`:

```tsx
import { getTitleProgress } from '../../services/titles';

const fmt = (n: number) => n.toLocaleString('en-US');

export default function XPBar({ xp }: { xp: number }) {
  const p = getTitleProgress(xp);
  const pct = Math.round(p.fraction * 1000) / 10;
  const text = p.nextTitle ? `${fmt(p.current)} / ${fmt(p.span)} XP to ${p.nextTitle}` : 'Top title reached';
  return (
    <div>
      <div
        role="progressbar"
        aria-label="XP progress"
        aria-valuemin={0}
        aria-valuemax={p.span}
        aria-valuenow={p.current}
        className="h-3 overflow-hidden rounded-full border border-border-strong bg-surface"
      >
        <div data-testid="xp-fill" className="h-full rounded-full bg-gold-400" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-sm font-bold text-muted">{text}</p>
    </div>
  );
}
```

(The `h-3` here is a decorative track, not a button or chip, so the min-height rule does not apply.)

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/services/titles.test.ts src/components/ui/Meters.test.tsx`
Expected: PASS. Note `toHaveStyle({ width: '16.4%' })` works because the inline style is exactly `16.4%`.

- [ ] **Step 5: Checkpoint**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all green. Then the owner commits.

---

### Task 8: Toggle and Banner

**Files:**
- Create: `src/components/ui/Toggle.tsx`, `src/components/ui/Banner.tsx`
- Test: `src/components/ui/Toggle.test.tsx`, `src/components/ui/Banner.test.tsx`

**Interfaces:**
- Consumes: `cx`, `Icon`.
- Produces:
  - `Toggle({ label: string; description?: string; checked: boolean; onChange(checked: boolean): void })`: whole row is a `<label>` (44px min), a real `<input type="checkbox" role="switch">`, visible "On"/"Off" text (aria-hidden, the switch state is announced natively), off track uses `border-border-strong`.
  - `Banner({ variant: 'offline' | 'error'; children; action? })`: `offline` is `role="status"`, `error` is `role="alert"`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/ui/Toggle.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import Toggle from './Toggle';

function Harness({ initial = false }: { initial?: boolean }) {
  const [on, setOn] = useState(initial);
  return <Toggle label="Reduce motion" description="Fewer animations" checked={on} onChange={setOn} />;
}

describe('Toggle', () => {
  it('is a switch named by its label', () => {
    render(<Harness />);
    expect(screen.getByRole('switch', { name: 'Reduce motion' })).not.toBeChecked();
    expect(screen.getByText('Off')).toBeInTheDocument();
  });

  it('toggles when the label text (the whole row) is clicked', async () => {
    render(<Harness />);
    await userEvent.setup().click(screen.getByText('Fewer animations'));
    expect(screen.getByRole('switch', { name: 'Reduce motion' })).toBeChecked();
    expect(screen.getByText('On')).toBeInTheDocument();
  });

  it('toggles with the Space key', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.tab();
    expect(screen.getByRole('switch')).toHaveFocus();
    await user.keyboard(' ');
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('has a 44px minimum row height', () => {
    const { container } = render(<Harness />);
    expect(container.querySelector('label')!.className).toContain('min-h-11');
  });
});
```

Create `src/components/ui/Banner.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Banner from './Banner';

describe('Banner', () => {
  it('offline banner is a polite status', () => {
    render(<Banner variant="offline">You are offline. Progress saves on this device.</Banner>);
    expect(screen.getByRole('status')).toHaveTextContent('You are offline');
  });
  it('error banner is an alert and shows its action', () => {
    render(
      <Banner variant="error" action={<button type="button">Retry</button>}>
        Cannot play the sound.
      </Banner>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Cannot play the sound.');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/components/ui/Toggle.test.tsx src/components/ui/Banner.test.tsx`
Expected: FAIL (cannot resolve `./Toggle`).

- [ ] **Step 3: Implement**

Create `src/components/ui/Toggle.tsx`:

```tsx
import { useId } from 'react';
import { cx } from '../../lib/cx';

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange(checked: boolean): void;
}

export default function Toggle({ label, description, checked, onChange }: ToggleProps) {
  const labelId = useId();
  return (
    <label className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-4 rounded-xl py-2">
      <span className="flex flex-col">
        <span id={labelId} className="text-base font-bold">
          {label}
        </span>
        {description && <span className="text-sm text-muted">{description}</span>}
      </span>
      <span className="flex items-center gap-2">
        <span aria-hidden="true" className="text-sm font-bold">
          {checked ? 'On' : 'Off'}
        </span>
        <input
          type="checkbox"
          role="switch"
          aria-labelledby={labelId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={cx(
            'relative h-7 w-12 shrink-0 rounded-full border-2',
            checked ? 'border-brand-600 bg-brand-600' : 'border-border-strong bg-surface',
            'peer-focus-visible:[outline:3px_solid_var(--color-ink)] peer-focus-visible:outline-offset-2 peer-focus-visible:shadow-[0_0_0_2px_#fff]',
          )}
        >
          <span
            className={cx(
              'absolute top-0.5 size-5 rounded-full',
              checked ? 'left-6 bg-white' : 'left-0.5 bg-border-strong',
            )}
          />
        </span>
      </span>
    </label>
  );
}
```

Create `src/components/ui/Banner.tsx`:

```tsx
import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import Icon from './Icon';

export default function Banner({
  variant,
  children,
  action,
}: {
  variant: 'offline' | 'error';
  children: ReactNode;
  action?: ReactNode;
}) {
  const isError = variant === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={cx(
        'flex flex-wrap items-center gap-3 rounded-xl border-2 px-4 py-3 text-base font-bold',
        isError ? 'border-danger-text bg-danger-50 text-danger-text' : 'border-border-strong bg-brand-50 text-ink',
      )}
    >
      {isError && <Icon name="cross" size={20} />}
      <span className="min-w-0 flex-1">{children}</span>
      {action}
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/components/ui/Toggle.test.tsx src/components/ui/Banner.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Checkpoint**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all green. Then the owner commits.

---

### Task 9: Modal (accessible dialog)

**Files:**
- Create: `src/components/ui/Modal.tsx`
- Test: `src/components/ui/Modal.test.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `Modal({ open: boolean; title: string; description?: string; onSafeAction(): void; initialFocusRef?: RefObject<HTMLElement | null>; children: ReactNode })`. Portals to `document.body`, `role="dialog" aria-modal="true"` labelled by the title and described by the description; focuses `initialFocusRef` or the first focusable child; traps Tab/Shift+Tab; sets `inert` on every other `<body>` child while open; Esc calls `onSafeAction` (never closes silently); restores focus to the opener on close. This is an accessible equivalent to `<dialog>` chosen because jsdom does not implement `showModal()`.

- [ ] **Step 1: Write the failing test**

Create `src/components/ui/Modal.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import Modal from './Modal';

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <Modal open={open} title="Leave this round?" description="Your progress will be lost." onSafeAction={() => setOpen(false)}>
        <button type="button" onClick={() => setOpen(false)}>
          Keep playing
        </button>
        <button type="button">Leave</button>
      </Modal>
    </>
  );
}

describe('Modal', () => {
  it('renders nothing while closed', () => {
    render(<Harness />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is a labelled, described, modal dialog with focus on the first action', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = screen.getByRole('dialog', { name: 'Leave this round?' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('Your progress will be lost.');
    expect(screen.getByRole('button', { name: 'Keep playing' })).toHaveFocus();
  });

  it('traps Tab and Shift+Tab inside the dialog', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.tab();
    expect(screen.getByRole('button', { name: 'Leave' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Keep playing' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Leave' })).toHaveFocus();
  });

  it('makes the rest of the page inert while open and restores it after', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(container).toHaveAttribute('inert');
    await user.keyboard('{Escape}');
    expect(container).not.toHaveAttribute('inert');
  });

  it('Esc runs the safe action and returns focus to the opener', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Open' });
    await user.click(opener);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(opener).toHaveFocus();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/components/ui/Modal.test.tsx`
Expected: FAIL (cannot resolve `./Modal`).

- [ ] **Step 3: Implement**

Create `src/components/ui/Modal.tsx`:

```tsx
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  /** Run on Esc. Must be the non-destructive choice, for example "Keep playing". */
  onSafeAction(): void;
  initialFocusRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function focusables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.hasAttribute('disabled'));
}

export default function Modal({ open, title, description, onSafeAction, initialFocusRef, children }: ModalProps) {
  const titleId = useId();
  const descId = useId();
  const hostRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const host = hostRef.current;
    const panel = panelRef.current;
    if (!host || !panel) return;
    const others = [...document.body.children].filter((el) => el !== host && !el.hasAttribute('inert'));
    others.forEach((el) => el.setAttribute('inert', ''));
    (initialFocusRef?.current ?? focusables(panel)[0] ?? panel).focus();
    return () => {
      others.forEach((el) => el.removeAttribute('inert'));
      opener?.focus?.();
    };
  }, [open, initialFocusRef]);

  if (!open) return null;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onSafeAction();
      return;
    }
    if (e.key !== 'Tab' || !panelRef.current) return;
    const items = focusables(panelRef.current);
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div ref={hostRef} className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4" onKeyDown={onKeyDown}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-chunky outline-none"
      >
        <h2 id={titleId} className="text-xl font-extrabold">
          {title}
        </h2>
        {description && (
          <p id={descId} className="mt-2 text-base text-muted">
            {description}
          </p>
        )}
        <div className="mt-5 flex flex-col gap-3">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/components/ui/Modal.test.tsx && npx tsc --noEmit`
Expected: PASS (5 tests).

- [ ] **Step 5: Checkpoint**

Run: `npx vitest run`
Expected: all green. Then the owner commits.

---

### Task 10: UsernameInput

**Files:**
- Create: `src/components/ui/UsernameInput.tsx`
- Test: `src/components/ui/UsernameInput.test.tsx`

**Interfaces:**
- Produces: `UsernameInput({ value: string; onChange(value: string): void; error?: string; label?: string })` (default label "Username"). Real `<label for>`, `autocomplete="username"`, `autocapitalize="none"`, `spellcheck="false"`, `enterkeyhint="go"`, error text linked by `aria-describedby` with `aria-invalid`, paste allowed, 16px text (`text-base`) so iOS does not zoom.

- [ ] **Step 1: Write the failing test**

Create `src/components/ui/UsernameInput.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import UsernameInput from './UsernameInput';

describe('UsernameInput', () => {
  it('has a real label and the mobile-friendly attributes', () => {
    render(<UsernameInput value="" onChange={() => {}} />);
    const input = screen.getByLabelText('Username');
    expect(input).toHaveAttribute('autocomplete', 'username');
    expect(input).toHaveAttribute('autocapitalize', 'none');
    expect(input).toHaveAttribute('spellcheck', 'false');
    expect(input).toHaveAttribute('enterkeyhint', 'go');
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('links the error with aria-describedby and sets aria-invalid', () => {
    render(<UsernameInput value="ade" onChange={() => {}} error="That name is taken" />);
    const input = screen.getByLabelText('Username');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('That name is taken');
  });

  it('reports typed text', async () => {
    const onChange = vi.fn();
    render(<UsernameInput value="" onChange={onChange} />);
    await userEvent.setup().type(screen.getByLabelText('Username'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('allows a custom label', () => {
    render(<UsernameInput value="" onChange={() => {}} label="Your name" />);
    expect(screen.getByLabelText('Your name')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/components/ui/UsernameInput.test.tsx`
Expected: FAIL (cannot resolve `./UsernameInput`).

- [ ] **Step 3: Implement**

Create `src/components/ui/UsernameInput.tsx`:

```tsx
import { useId } from 'react';
import { cx } from '../../lib/cx';

interface UsernameInputProps {
  value: string;
  onChange(value: string): void;
  error?: string;
  label?: string;
}

export default function UsernameInput({ value, onChange, error, label = 'Username' }: UsernameInputProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-base font-bold">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="go"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cx(
          'min-h-12 rounded-xl border-2 bg-surface px-4 text-base',
          error ? 'border-danger-text' : 'border-border-strong',
        )}
      />
      {error && (
        <p id={errorId} className="text-sm font-bold text-danger-text">
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/components/ui/UsernameInput.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Checkpoint**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all green. Then the owner commits.

---

## Phase B: Router and shell

### Task 11: Router, route guard, placeholder screens, Vercel rewrite

**Files:**
- Create: `src/app/AppRoutes.tsx`, `src/app/RequireOnboarded.tsx`, `src/app/PlaceholderScreen.tsx`, `src/app/Shell.tsx` (minimal for now), `vercel.json`
- Modify: `src/App.tsx`
- Test: `src/app/AppRoutes.test.tsx`

**Interfaces:**
- Consumes: `useProfileStore` (`hasOnboarded`), `COLLECTIONS`.
- Produces: default export `AppRoutes()` (must be rendered inside a router); `PlaceholderScreen({ title: string; children? })` rendering one `<h1>`; `Shell()` layout route rendering `<main id="main"><Outlet /></main>` (full shell in Task 12). Routes: `/` redirect (onboarded to `/dashboard`, else `/onboarding`), `/onboarding` and `/placement` public, guarded `/collections`, `/play/:collectionId`, `/result`, `/dashboard`, `/profile`, `/settings`, `/graduation`; unknown paths redirect to `/`; unknown `collectionId` redirects to `/collections`. Placeholder `h1` text: Onboarding "Welcome to SabiSpell", Placement "Placement test", Collections "Collections", Play "Spelling round", Result "Round result", Dashboard "Home", Profile "Profile", Settings "Settings", Graduation "Graduation".

- [ ] **Step 1: Write the failing test**

Create `src/app/AppRoutes.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { useProfileStore } from '../store/profileStore';
import AppRoutes from './AppRoutes';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  useProfileStore.getState().reset(0);
});

describe('route guard', () => {
  it('sends a new player from / to onboarding', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome to SabiSpell' })).toBeInTheDocument();
  });

  it('sends an onboarded player from / to the dashboard', () => {
    useProfileStore.setState({ hasOnboarded: true });
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
  });

  it('keeps a new player out of guarded routes', () => {
    renderAt('/collections');
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome to SabiSpell' })).toBeInTheDocument();
  });

  it('lets a new player reach placement', () => {
    renderAt('/placement');
    expect(screen.getByRole('heading', { level: 1, name: 'Placement test' })).toBeInTheDocument();
  });
});

describe('screens', () => {
  it.each([
    ['/collections', 'Collections'],
    ['/play/classic', 'Spelling round'],
    ['/result', 'Round result'],
    ['/dashboard', 'Home'],
    ['/profile', 'Profile'],
    ['/settings', 'Settings'],
    ['/graduation', 'Graduation'],
  ])('%s has an h1 "%s" inside main', (path, title) => {
    useProfileStore.setState({ hasOnboarded: true });
    renderAt(path);
    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByRole('heading', { level: 1, name: title }));
  });

  it('redirects an unknown collection to the collection list', () => {
    useProfileStore.setState({ hasOnboarded: true });
    renderAt('/play/bogus');
    expect(screen.getByRole('heading', { level: 1, name: 'Collections' })).toBeInTheDocument();
  });

  it('redirects unknown paths to /', () => {
    useProfileStore.setState({ hasOnboarded: true });
    renderAt('/nope');
    expect(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/app/AppRoutes.test.tsx`
Expected: FAIL (cannot resolve `./AppRoutes`).

- [ ] **Step 3: Implement**

Create `src/app/PlaceholderScreen.tsx`:

```tsx
import type { ReactNode } from 'react';

/** Stand-in until the real screen ships in plan 1c-B or 1c-C. The shell supplies header, nav and main. */
export default function PlaceholderScreen({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="py-4">
      <h1 className="text-3xl font-extrabold">{title}</h1>
      {children ?? <p className="mt-2 text-muted">This screen is coming soon.</p>}
    </section>
  );
}
```

Create `src/app/RequireOnboarded.tsx`:

```tsx
import { Navigate, Outlet } from 'react-router';
import { useProfileStore } from '../store/profileStore';

export default function RequireOnboarded() {
  const hasOnboarded = useProfileStore((s) => s.hasOnboarded);
  return hasOnboarded ? <Outlet /> : <Navigate to="/onboarding" replace />;
}
```

Create `src/app/Shell.tsx` (minimal; replaced in Task 12):

```tsx
import { Outlet } from 'react-router';

export default function Shell() {
  return (
    <main id="main" tabIndex={-1}>
      <Outlet />
    </main>
  );
}
```

Create `src/app/AppRoutes.tsx`:

```tsx
import { Navigate, Route, Routes, useParams } from 'react-router';
import { COLLECTIONS } from '../data/collections';
import { useProfileStore } from '../store/profileStore';
import PlaceholderScreen from './PlaceholderScreen';
import RequireOnboarded from './RequireOnboarded';
import Shell from './Shell';

function HomeRedirect() {
  const hasOnboarded = useProfileStore((s) => s.hasOnboarded);
  return <Navigate to={hasOnboarded ? '/dashboard' : '/onboarding'} replace />;
}

function PlayScreen() {
  const { collectionId = '' } = useParams();
  if (!Object.hasOwn(COLLECTIONS, collectionId)) return <Navigate to="/collections" replace />;
  return <PlaceholderScreen title="Spelling round" />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<HomeRedirect />} />
        <Route path="/onboarding" element={<PlaceholderScreen title="Welcome to SabiSpell" />} />
        <Route path="/placement" element={<PlaceholderScreen title="Placement test" />} />
        <Route element={<RequireOnboarded />}>
          <Route path="/collections" element={<PlaceholderScreen title="Collections" />} />
          <Route path="/play/:collectionId" element={<PlayScreen />} />
          <Route path="/result" element={<PlaceholderScreen title="Round result" />} />
          <Route path="/dashboard" element={<PlaceholderScreen title="Home" />} />
          <Route path="/profile" element={<PlaceholderScreen title="Profile" />} />
          <Route path="/settings" element={<PlaceholderScreen title="Settings" />} />
          <Route path="/graduation" element={<PlaceholderScreen title="Graduation" />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
```

Replace `src/App.tsx` with:

```tsx
import { BrowserRouter } from 'react-router';
import AppRoutes from './app/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
```

Create `vercel.json` in `web/`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

(The repo-root `vercel.json` belongs to the legacy Expo app and is untouched. When the Vercel project's root directory is `web/`, this file applies; static assets and `sw.js` are served from the filesystem first, so the catch-all rewrite only affects unmatched paths.)

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/app/AppRoutes.test.tsx && npx tsc --noEmit`
Expected: PASS (13 tests), no type errors.

- [ ] **Step 5: Checkpoint**

Run: `npx vitest run && npm run build`
Expected: all tests green; build succeeds; `dist/manifest.webmanifest` and `dist/sw.js` exist (`ls dist`). Then the owner commits.

---

### Task 12: Layout shell with nav, Help slot, page tint, live region

**Files:**
- Create: `src/components/nav/MainNav.tsx`
- Modify (replace): `src/app/Shell.tsx`
- Test: `src/app/Shell.test.tsx`

**Interfaces:**
- Consumes: `Wordmark`, `LiveRegion` (Task 4), `IconButton`, `Button`, `Modal`, `Icon`, `useReducedMotion` (Task 3), `AppRoutes` (Task 11).
- Produces:
  - `MainNav()`: single `<nav aria-label="Main">` with Home (`/dashboard`), Collections (`/collections`), Profile (`/profile`) `NavLink`s; `aria-current="page"` comes from `NavLink`. Bottom bar below `lg`, left rail at `lg`+. Items `min-h-14`.
  - `Shell()` landmark order in the DOM: `<header>` (Wordmark and Help `IconButton` at the top right, 44px of top safe space on installed PWAs), `<nav>`, `<main id="main" tabIndex={-1}>`, `LiveRegion`. Help opens a `Modal` titled "How to play" whose only action "Got it" is the safe action. Page-tint gutters from `md` up, content column `max-w-md` then `md:max-w-2xl` then `lg:max-w-6xl`.

- [ ] **Step 1: Write the failing test**

Create `src/app/Shell.test.tsx`:

```tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { useProfileStore } from '../store/profileStore';
import AppRoutes from './AppRoutes';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  useProfileStore.getState().reset(0);
  useProfileStore.setState({ hasOnboarded: true });
});

describe('Shell', () => {
  it('has header, navigation, main and a live region', () => {
    renderAt('/collections');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('nav has Home, Collections, Profile and marks the current page', () => {
    renderAt('/collections');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['Home', 'Collections', 'Profile']);
    expect(within(nav).getByRole('link', { name: 'Collections' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('nav items meet the 44px target', () => {
    renderAt('/profile');
    for (const link of within(screen.getByRole('navigation', { name: 'Main' })).getAllByRole('link')) {
      expect(link.className).toContain('min-h-14');
    }
  });

  it('puts the header before the nav before main in DOM order', () => {
    renderAt('/profile');
    const header = screen.getByRole('banner');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    const main = screen.getByRole('main');
    expect(header.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(nav.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('Help opens a dialog; Esc closes it and returns focus to Help', async () => {
    const user = userEvent.setup();
    renderAt('/dashboard');
    const help = screen.getByRole('button', { name: 'Help' });
    await user.click(help);
    expect(screen.getByRole('dialog', { name: 'How to play' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(help).toHaveFocus();
  });

  it('applies page-tint gutters from tablet width up', () => {
    const { container } = renderAt('/dashboard');
    expect(container.firstElementChild!.className).toContain('md:bg-page-tint');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/app/Shell.test.tsx`
Expected: FAIL (no banner/navigation yet).

- [ ] **Step 3: Implement**

Create `src/components/nav/MainNav.tsx`:

```tsx
import { NavLink } from 'react-router';
import Icon, { type IconName } from '../ui/Icon';

const ITEMS: { to: string; label: string; icon: IconName }[] = [
  { to: '/dashboard', label: 'Home', icon: 'home' },
  { to: '/collections', label: 'Collections', icon: 'collections' },
  { to: '/profile', label: 'Profile', icon: 'profile' },
];

/** One nav element: a bottom bar below 1024px, a left rail at 1024px and up. NavLink sets aria-current="page". */
export default function MainNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface lg:static lg:z-auto lg:col-start-1 lg:row-start-2 lg:border-t-0 lg:border-r lg:bg-transparent"
    >
      <ul className="flex justify-around lg:flex-col lg:justify-start lg:gap-1 lg:p-3">
        {ITEMS.map((item) => (
          <li key={item.to} className="flex-1 lg:flex-none">
            <NavLink
              to={item.to}
              className="flex min-h-14 min-w-11 flex-col items-center justify-center gap-0.5 text-sm font-bold text-muted aria-[current=page]:bg-brand-50 aria-[current=page]:text-brand-700 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-xl lg:px-4 [@media(pointer:coarse)]:min-h-16"
            >
              <Icon name={item.icon} size={24} />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

Replace `src/app/Shell.tsx` with:

```tsx
import { useState } from 'react';
import { Outlet } from 'react-router';
import LiveRegion from '../components/LiveRegion';
import MainNav from '../components/nav/MainNav';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import Modal from '../components/ui/Modal';
import Wordmark from '../components/Wordmark';
import { useReducedMotion } from '../hooks/useReducedMotion';

export default function Shell() {
  useReducedMotion();
  const [helpOpen, setHelpOpen] = useState(false);
  return (
    <div className="min-h-dvh md:bg-page-tint">
      <div className="mx-auto grid min-h-dvh max-w-md grid-rows-[auto_1fr] bg-background md:max-w-2xl lg:max-w-6xl lg:grid-cols-[14rem_1fr]">
        <header className="flex items-center justify-between px-4 pb-2 pt-3 lg:col-span-2 [@media(display-mode:standalone)]:pt-11">
          <Wordmark size={28} />
          <IconButton icon="help" label="Help" onClick={() => setHelpOpen(true)} />
        </header>
        <MainNav />
        <main
          id="main"
          tabIndex={-1}
          className="px-4 pb-24 outline-none lg:col-start-2 lg:row-start-2 lg:pb-8"
        >
          <Outlet />
        </main>
      </div>
      <Modal
        open={helpOpen}
        title="How to play"
        description="Listen to the word, then spell it with the keyboard. You can replay the sound any time."
        onSafeAction={() => setHelpOpen(false)}
      >
        <Button onClick={() => setHelpOpen(false)}>Got it</Button>
      </Modal>
      <LiveRegion />
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/app && npx tsc --noEmit`
Expected: PASS (Shell and AppRoutes tests).

- [ ] **Step 5: Checkpoint**

Run: `npx vitest run && npm run build`
Expected: all green; build emits `manifest.webmanifest` and `sw.js`. Then the owner commits.

---

### Task 13: Skip link and focus management on route change

**Files:**
- Create: `src/components/SkipLink.tsx`, `src/hooks/useRouteFocus.ts`
- Modify: `src/app/Shell.tsx`
- Test: `src/app/focus.test.tsx`

**Interfaces:**
- Consumes: `Shell`, `AppRoutes`.
- Produces: `SkipLink()` (first focusable element, visible on focus, moves focus to `#main`); `useRouteFocus()` (on every pathname change after the first render, focuses the first `main h1`, giving it `tabindex="-1"`).

- [ ] **Step 1: Write the failing test**

Create `src/app/focus.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { useProfileStore } from '../store/profileStore';
import AppRoutes from './AppRoutes';

beforeEach(() => {
  localStorage.clear();
  useProfileStore.getState().reset(0);
  useProfileStore.setState({ hasOnboarded: true });
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('focus management', () => {
  it('does not steal focus on first load', () => {
    renderAt('/dashboard');
    expect(document.body).toHaveFocus();
  });

  it('moves focus to the new screen heading after navigation', async () => {
    const user = userEvent.setup();
    renderAt('/dashboard');
    await user.click(screen.getByRole('link', { name: 'Collections' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Collections' })).toHaveFocus();
  });

  it('has a skip link as the first tab stop that focuses main', async () => {
    const user = userEvent.setup();
    renderAt('/dashboard');
    await user.tab();
    const skip = screen.getByRole('link', { name: 'Skip to main content' });
    expect(skip).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('main')).toHaveFocus();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/app/focus.test.tsx`
Expected: FAIL (no skip link; heading not focused).

- [ ] **Step 3: Implement**

Create `src/components/SkipLink.tsx`:

```tsx
export default function SkipLink() {
  return (
    <a
      href="#main"
      onClick={(e) => {
        e.preventDefault();
        document.getElementById('main')?.focus();
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-3 focus:font-extrabold focus:text-brand-700"
    >
      Skip to main content
    </a>
  );
}
```

Create `src/hooks/useRouteFocus.ts`:

```ts
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

/** After each navigation, move focus to the new screen's h1 so keyboard and screen-reader users land at the top. */
export function useRouteFocus(): void {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const heading = document.querySelector<HTMLElement>('main h1');
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus();
  }, [pathname]);
}
```

(In React StrictMode dev builds the effect runs twice on mount, so the heading may take focus on first load in development only.)

In `src/app/Shell.tsx` make these edits:
1. Add imports: `import SkipLink from '../components/SkipLink';` and `import { useRouteFocus } from '../hooks/useRouteFocus';`
2. Under `useReducedMotion();` add the line `useRouteFocus();`
3. Directly inside the outermost `<div className="min-h-dvh md:bg-page-tint">`, before the inner grid `<div>`, add `<SkipLink />`.

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/app`
Expected: PASS (Shell, AppRoutes, focus tests).

- [ ] **Step 5: Checkpoint**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all green. Then the owner commits.

---

## Phase C: Hand-off and economy logic fixes

### Task 14: Economy constants and derived prices

**Files:**
- Modify: `src/config.ts`, `src/services/economy.ts`, `src/services/economy.test.ts`

**Interfaces:**
- Consumes: `Config`.
- Produces in `Config`: remove `HINT_COST_COINS`; add `BASE_COINS_FLOOR: 5`, `BASE_COINS_SKILL_STEP: 200`, `HINT_PRICE_MIN: 3`, `HINT_PRICE_FACTOR: 0.6`, `REFILL_PRICE_FACTOR: 8`, `REFILL_MAX_PER_DAY: 2`, `REFILL_MAX_ENERGY: 1`, `REPEAT_WORD_FACTOR: 0.25`, `HINTED_FACTOR: 0.5`, `DAILY_COIN_CAP: 600`, `DAILY_XP_CAP: 1200`, `OVER_CAP_FACTOR: 0.25`, `GRADUATION_FAIL_COOLDOWN_MS: 86_400_000`, `WORD_HISTORY_CAP: 500`; set `STARTER_COINS: 100`. In `economy.ts`: `baseCoinsFor(skill: number): number`, `hintPrice(skill: number): number`, `refillPrice(skill: number): number`. `b = 5 + floor(skill / 200)`; hint is `max(3, round(0.6 * b))`; refill is `8 * b`. `REWARD_MULTIPLIER_CAP` is changed in Task 15 so this task keeps all existing tests green.

`STARTER_COINS` changes in Task 17 together with its tests; leave it at 150 in this task. (Listed above for the final shape only.)

- [ ] **Step 1: Write the failing test**

Append to `src/services/economy.test.ts` (and add `baseCoinsFor, hintPrice, refillPrice` to its import from `./economy`):

```ts
describe('derived prices', () => {
  it('base coins: 5 + floor(skill / 200)', () => {
    expect(baseCoinsFor(100)).toBe(5);
    expect(baseCoinsFor(1100)).toBe(10);
    expect(baseCoinsFor(1220)).toBe(11);
    expect(baseCoinsFor(2000)).toBe(15);
  });

  it('hint costs max(3, round(0.6 * b))', () => {
    expect(hintPrice(1100)).toBe(6); // Classic
    expect(hintPrice(100)).toBe(3); // Yoruba start
    expect(hintPrice(1500)).toBe(7); // b = 12, 7.2 rounds to 7
    expect(hintPrice(0)).toBe(3);
  });

  it('refill costs 8 * b', () => {
    expect(refillPrice(1100)).toBe(80);
    expect(refillPrice(100)).toBe(40);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/services/economy.test.ts`
Expected: FAIL (`baseCoinsFor is not a function`).

- [ ] **Step 3: Implement**

In `src/config.ts`:
- Delete the line `HINT_COST_COINS: 10,`.
- After `STARTER_COINS: 150,` add:

```ts
  BASE_COINS_FLOOR: 5,
  BASE_COINS_SKILL_STEP: 200,
  HINT_PRICE_MIN: 3,
  HINT_PRICE_FACTOR: 0.6,
  REFILL_PRICE_FACTOR: 8,
  REFILL_MAX_PER_DAY: 2,
  REFILL_MAX_ENERGY: 1,
  REPEAT_WORD_FACTOR: 0.25,
  HINTED_FACTOR: 0.5,
  DAILY_COIN_CAP: 600,
  DAILY_XP_CAP: 1200,
  OVER_CAP_FACTOR: 0.25,
  GRADUATION_FAIL_COOLDOWN_MS: 24 * 60 * 60 * 1000,
  WORD_HISTORY_CAP: 500,
```

In `src/services/economy.ts` add above `calculateReward`:

```ts
/** b: base coins per correct word at a skill level. */
export function baseCoinsFor(skill: number): number {
  return Config.BASE_COINS_FLOOR + Math.floor(skill / Config.BASE_COINS_SKILL_STEP);
}

export function hintPrice(skill: number): number {
  return Math.max(Config.HINT_PRICE_MIN, Math.round(Config.HINT_PRICE_FACTOR * baseCoinsFor(skill)));
}

export function refillPrice(skill: number): number {
  return Config.REFILL_PRICE_FACTOR * baseCoinsFor(skill);
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/services/economy.test.ts && npx tsc --noEmit`
Expected: PASS; `tsc` clean (nothing referenced `HINT_COST_COINS`).

- [ ] **Step 5: Checkpoint**

Run: `npx vitest run`
Expected: all green. Then the owner commits.

---

### Task 15: calculateReward: additive multipliers, repeat, hinted, practise

**Files:**
- Modify: `src/config.ts` (`REWARD_MULTIPLIER_CAP: 2.0`), `src/services/economy.ts`, `src/services/economy.test.ts`

**Interfaces:**
- Consumes: `baseCoinsFor`.
- Produces: `interface RewardOptions { isDailyChallenge?: boolean; isRepeat?: boolean; wasHinted?: boolean; practice?: boolean }` and `calculateReward(wordSSR: number, isCorrect: boolean, currentStreak: number, options?: boolean | RewardOptions): RewardResult`. The fourth argument stays backward compatible: a boolean means `isDailyChallenge`.

Rules implemented (decision: "no rounding inflation" means each reward is rounded exactly once, after all factors are combined, with a floor of 1):
- factor = `min(2.0, 1 + (streakMult - 1) + (dailyMult - 1))`
- `wasHinted`: factor = 0.5 (no streak or daily bonus)
- `isRepeat`: factor multiplied by 0.25
- amount = `max(1, round(base * factor))` for coins and XP (`xp base = 2 * coins base`)
- `practice` or wrong answer: zero.

Behaviour change on purpose: streak 10 plus daily is now 2.0x (was 2.25x), so XP 50 becomes 44 and coins 25 becomes 22.

- [ ] **Step 1: Update and add tests**

In `src/services/economy.test.ts` replace the test `multiplies streak by the daily challenge bonus` with:

```ts
  it('adds streak and daily bonuses (1 + 0.5 + 0.5), capped at 2.0', () => {
    expect(calculateReward(1220, true, 10, true)).toEqual({ xp: 44, coins: 22 });
  });
```

Append:

```ts
describe('calculateReward options', () => {
  it('still accepts a boolean daily flag as the fourth argument', () => {
    expect(calculateReward(1220, true, 0, true)).toEqual(calculateReward(1220, true, 0, { isDailyChallenge: true }));
  });

  it('never goes above the 2.0 cap', () => {
    const r = calculateReward(1220, true, 99, { isDailyChallenge: true });
    expect(r.coins).toBeLessThanOrEqual(11 * 2);
    expect(r.xp).toBeLessThanOrEqual(22 * 2);
  });

  it('never pays less than base when no discount applies', () => {
    for (const streak of [0, 3, 5, 10]) {
      const r = calculateReward(100, true, streak);
      expect(r.coins).toBeGreaterThanOrEqual(5);
      expect(r.xp).toBeGreaterThanOrEqual(10);
    }
  });

  it('repeat words pay a quarter, minimum 1', () => {
    expect(calculateReward(1220, true, 0, { isRepeat: true })).toEqual({ xp: 6, coins: 3 });
    expect(calculateReward(100, true, 0, { isRepeat: true }).coins).toBe(1);
  });

  it('hinted words pay half with no streak or daily bonus', () => {
    expect(calculateReward(1220, true, 10, { wasHinted: true, isDailyChallenge: true })).toEqual({ xp: 11, coins: 6 });
  });

  it('rounds once after combining factors (repeat and hinted)', () => {
    // 11 coins * 0.125 = 1.375 -> 1; 22 xp * 0.125 = 2.75 -> 3
    expect(calculateReward(1220, true, 0, { isRepeat: true, wasHinted: true })).toEqual({ xp: 3, coins: 1 });
  });

  it('practice mode and wrong answers pay nothing', () => {
    expect(calculateReward(1220, true, 5, { practice: true })).toEqual({ xp: 0, coins: 0 });
    expect(calculateReward(1220, false, 5, { isRepeat: true })).toEqual({ xp: 0, coins: 0 });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/services/economy.test.ts`
Expected: FAIL (the updated daily test gets 50/25; option tests fail).

- [ ] **Step 3: Implement**

In `src/config.ts` change `REWARD_MULTIPLIER_CAP: 2.5,` to `REWARD_MULTIPLIER_CAP: 2.0,`.

In `src/services/economy.ts` replace the whole `calculateReward` function and the `RewardResult` neighbourhood with:

```ts
export interface RewardOptions {
  isDailyChallenge?: boolean;
  isRepeat?: boolean;
  wasHinted?: boolean;
  practice?: boolean;
}

export function calculateReward(
  wordSSR: number,
  isCorrect: boolean,
  currentStreak: number,
  options: boolean | RewardOptions = false,
): RewardResult {
  const o: RewardOptions = typeof options === 'boolean' ? { isDailyChallenge: options } : options;
  if (!isCorrect || o.practice) return { xp: 0, coins: 0 };

  const baseCoins = baseCoinsFor(wordSSR);
  const baseXP = baseCoins * 2;
  const streakBonus =
    (Config.STREAK_MULTIPLIERS.find((s) => currentStreak >= s.minStreak)?.multiplier ?? 1) - 1;
  const dailyBonus = o.isDailyChallenge ? Config.DAILY_CHALLENGE_MULTIPLIER - 1 : 0;

  let factor = Math.min(Config.REWARD_MULTIPLIER_CAP, 1 + streakBonus + dailyBonus);
  if (o.wasHinted) factor = Config.HINTED_FACTOR; // hinted words get no streak or daily bonus
  if (o.isRepeat) factor *= Config.REPEAT_WORD_FACTOR;

  // Round once, after every factor is combined, so small values are not inflated.
  return {
    xp: Math.max(1, Math.round(baseXP * factor)),
    coins: Math.max(1, Math.round(baseCoins * factor)),
  };
}
```

(Keep the existing `export interface RewardResult` at the top of the file.)

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/services/economy.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Checkpoint**

Run: `npx vitest run`
Expected: all green. Then the owner commits.

---

### Task 16: Daily earn cap and daily claim (pure functions)

**Files:**
- Modify: `src/services/streak.ts`, `src/services/streak.test.ts`, `src/services/economy.ts`, `src/services/economy.test.ts`

**Interfaces:**
- Consumes: `Config.DAILY_COIN_CAP`, `DAILY_XP_CAP`, `OVER_CAP_FACTOR`; `RewardResult`.
- Produces:
  - `laterDate(current: string, candidate: string): string` in `streak.ts`: returns the later of two ISO dates; an invalid `current` loses to a valid `candidate`; an invalid `candidate` is ignored.
  - `interface DailyEarned { coins: number; xp: number }`
  - `applyDailyCap(reward: RewardResult, earned: DailyEarned, dailyDate: string, today: string): { reward: RewardResult; earned: DailyEarned; date: string }`: resets `earned` when `dailyDate !== today`; full rate up to 600 coins / 1,200 XP per local day, then `round(25%)` of the over-cap part; `earned` accumulates what was granted.
  - `canClaimDaily(lastDailyDate: string, today: string): boolean`: true once per local day; a clock rewind never allows a second claim.

- [ ] **Step 1: Write the failing tests**

Append to `src/services/streak.test.ts` (add `laterDate` to its import from `./streak`; add `describe` to the vitest import if missing):

```ts
describe('laterDate', () => {
  it('keeps the later date (clock rewind ratchet)', () => {
    expect(laterDate('2026-11-12', '2026-11-10')).toBe('2026-11-12');
    expect(laterDate('2026-11-10', '2026-11-12')).toBe('2026-11-12');
  });
  it('replaces an empty or malformed current date', () => {
    expect(laterDate('', '2026-11-10')).toBe('2026-11-10');
    expect(laterDate('garbage', '2026-11-10')).toBe('2026-11-10');
  });
  it('ignores a malformed candidate', () => {
    expect(laterDate('2026-11-10', 'bad')).toBe('2026-11-10');
  });
});
```

Append to `src/services/economy.test.ts` (add `applyDailyCap, canClaimDaily` to the import):

```ts
describe('applyDailyCap', () => {
  const today = '2026-11-13';

  it('passes rewards through under the cap', () => {
    const r = applyDailyCap({ xp: 22, coins: 11 }, { coins: 0, xp: 0 }, today, today);
    expect(r.reward).toEqual({ xp: 22, coins: 11 });
    expect(r.earned).toEqual({ coins: 11, xp: 22 });
    expect(r.date).toBe(today);
  });

  it('pays 25% of the part over the cap', () => {
    // 595 earned, +10 coins: 5 at full rate + round(5 * 0.25) = 1
    const r = applyDailyCap({ xp: 0, coins: 10 }, { coins: 595, xp: 0 }, today, today);
    expect(r.reward.coins).toBe(6);
    expect(r.earned.coins).toBe(601);
  });

  it('pays 25% of everything once the cap is reached', () => {
    const r = applyDailyCap({ xp: 40, coins: 20 }, { coins: 600, xp: 1200 }, today, today);
    expect(r.reward).toEqual({ xp: 10, coins: 5 });
  });

  it('resets the counters on a new local day', () => {
    const r = applyDailyCap({ xp: 22, coins: 11 }, { coins: 600, xp: 1200 }, '2026-11-12', today);
    expect(r.reward).toEqual({ xp: 22, coins: 11 });
    expect(r.earned).toEqual({ coins: 11, xp: 22 });
    expect(r.date).toBe(today);
  });
});

describe('canClaimDaily', () => {
  it('allows one claim per local day', () => {
    expect(canClaimDaily('', '2026-11-13')).toBe(true);
    expect(canClaimDaily('2026-11-12', '2026-11-13')).toBe(true);
    expect(canClaimDaily('2026-11-13', '2026-11-13')).toBe(false);
  });
  it('does not allow a claim after a clock rewind', () => {
    expect(canClaimDaily('2026-11-13', '2026-11-10')).toBe(false);
  });
  it('treats a malformed saved date as unclaimed and a malformed today as not claimable', () => {
    expect(canClaimDaily('garbage', '2026-11-13')).toBe(true);
    expect(canClaimDaily('2026-11-12', 'bad')).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/services/streak.test.ts src/services/economy.test.ts`
Expected: FAIL (`laterDate`, `applyDailyCap`, `canClaimDaily` not exported).

- [ ] **Step 3: Implement**

Append to `src/services/streak.ts`:

```ts
/** Later of two ISO dates. Used so a clock rewind never lowers a stored date. */
export function laterDate(current: string, candidate: string): string {
  if (!isRealDate(candidate)) return current;
  if (!isRealDate(current)) return candidate;
  return candidate > current ? candidate : current;
}
```

In `src/services/economy.ts` add `import { laterDate } from './streak';` under the Config import, and append:

```ts
export interface DailyEarned {
  coins: number;
  xp: number;
}

function capOne(amount: number, earned: number, cap: number): number {
  const full = Math.max(0, Math.min(amount, cap - earned));
  return full + Math.round((amount - full) * Config.OVER_CAP_FACTOR);
}

/** Applies the daily 600 coin / 1,200 XP cap: full rate up to the cap, 25% above it. Resets on a new local day. */
export function applyDailyCap(
  reward: RewardResult,
  earned: DailyEarned,
  dailyDate: string,
  today: string,
): { reward: RewardResult; earned: DailyEarned; date: string } {
  const base = dailyDate === today ? earned : { coins: 0, xp: 0 };
  const granted = {
    coins: capOne(reward.coins, base.coins, Config.DAILY_COIN_CAP),
    xp: capOne(reward.xp, base.xp, Config.DAILY_XP_CAP),
  };
  return {
    reward: granted,
    earned: { coins: base.coins + granted.coins, xp: base.xp + granted.xp },
    date: today,
  };
}

/** The daily bonus is claimable once per local day; a clock rewind never re-opens it. */
export function canClaimDaily(lastDailyDate: string, today: string): boolean {
  return lastDailyDate !== today && laterDate(lastDailyDate, today) === today;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/services && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Checkpoint**

Run: `npx vitest run`
Expected: all green. Then the owner commits.

---

### Task 17: profileStore: recordPlay ratchet, atomic spendCoins, starter coins once per account

**Files:**
- Modify: `src/config.ts`, `src/store/profileStore.ts`, `src/store/profileStore.test.ts`
- Create: `src/services/starter.ts`
- Test: `src/services/starter.test.ts`

**Interfaces:**
- Consumes: `laterDate` (Task 16), `Config`.
- Produces:
  - `Config.STARTER_COINS = 100`; `Config.STORAGE_KEYS.STARTER = 'sabispell:starter-granted'`.
  - `hasStarterGrant(): boolean`, `markStarterGrant(): void` in `services/starter.ts` (storage access wrapped in try/catch; survives `reset()` because it uses its own key).
  - `profileStore.recordPlay` keeps the later `last_played_date` (no streak ratchet on a clock rewind).
  - `profileStore.spendCoins(n: number): boolean`: atomic; false (and no change) when `n` is not a non-negative integer or `n > coins`.
  - `completeOnboarding` grants `STARTER_COINS` only if `hasStarterGrant()` is false, then marks it.

- [ ] **Step 1: Write the failing tests**

Create `src/services/starter.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { hasStarterGrant, markStarterGrant } from './starter';

beforeEach(() => localStorage.clear());

describe('starter grant flag', () => {
  it('is false until marked, then true', () => {
    expect(hasStarterGrant()).toBe(false);
    markStarterGrant();
    expect(hasStarterGrant()).toBe(true);
  });

  it('does not throw when storage is unavailable', () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error('blocked');
    };
    expect(hasStarterGrant()).toBe(false);
    Storage.prototype.getItem = original;
  });
});
```

In `src/store/profileStore.test.ts`:
- Change both `expect(s.coins).toBe(150);` occurrences (the onboarding test and the "does not grant starter coins twice" test) to `.toBe(100)`.
- Append inside the `describe('profileStore', ...)` block:

```ts
  it('keeps the later played date when the clock is rewound', () => {
    const s = useProfileStore.getState();
    s.recordPlay('2026-11-11');
    s.recordPlay('2026-11-12');
    s.recordPlay('2026-11-09'); // clock moved back
    expect(useProfileStore.getState().last_played_date).toBe('2026-11-12');
    expect(useProfileStore.getState().daily_streak).toBe(2);
    s.recordPlay('2026-11-13');
    expect(useProfileStore.getState().daily_streak).toBe(3);
  });

  it('spendCoins is atomic: all or nothing', () => {
    useProfileStore.setState({ coins: 10 });
    expect(useProfileStore.getState().spendCoins(11)).toBe(false);
    expect(useProfileStore.getState().coins).toBe(10);
    expect(useProfileStore.getState().spendCoins(10)).toBe(true);
    expect(useProfileStore.getState().coins).toBe(0);
  });

  it('spendCoins rejects negative, fractional and non-finite amounts', () => {
    useProfileStore.setState({ coins: 10 });
    for (const bad of [-1, 1.5, NaN, Infinity]) {
      expect(useProfileStore.getState().spendCoins(bad)).toBe(false);
    }
    expect(useProfileStore.getState().coins).toBe(10);
  });

  it('grants starter coins once per account even after reset()', () => {
    useProfileStore.getState().completeOnboarding('Ade', 1300, 0);
    expect(useProfileStore.getState().coins).toBe(100);
    useProfileStore.getState().reset(0);
    useProfileStore.getState().completeOnboarding('Ade', 1300, 0);
    expect(useProfileStore.getState().coins).toBe(0);
    expect(useProfileStore.getState().hasOnboarded).toBe(true);
  });
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/services/starter.test.ts src/store/profileStore.test.ts`
Expected: FAIL (cannot resolve `./starter`; old store behaviours).

- [ ] **Step 3: Implement**

In `src/config.ts`: change `STARTER_COINS: 150,` to `STARTER_COINS: 100,` and replace the `STORAGE_KEYS` line with:

```ts
  STORAGE_KEYS: {
    PROFILE: 'sabispell:profile',
    SETTINGS: 'sabispell:settings',
    STARTER: 'sabispell:starter-granted',
  },
```

Create `src/services/starter.ts`:

```ts
import { Config } from '../config';

// Own storage key so reset() cannot clear it. Weak without a server (the player can clear site data); Phase 2 enforces it.
export function hasStarterGrant(): boolean {
  try {
    return localStorage.getItem(Config.STORAGE_KEYS.STARTER) === '1';
  } catch {
    return false;
  }
}

export function markStarterGrant(): void {
  try {
    localStorage.setItem(Config.STORAGE_KEYS.STARTER, '1');
  } catch {
    // Storage blocked or full: the grant just is not remembered.
  }
}
```

In `src/store/profileStore.ts`:
1. Change `import { nextStreak, todayISO } from '../services/streak';` to `import { laterDate, nextStreak, todayISO } from '../services/streak';` and add `import { hasStarterGrant, markStarterGrant } from '../services/starter';`
2. In `interface ProfileActions` add `spendCoins(amount: number): boolean;`.
3. Replace the `completeOnboarding` implementation with:

```ts
      completeOnboarding: (username, placementSSR, now = Date.now()) => {
        const name = username.trim();
        if (!name || get().hasOnboarded) return;
        const grant = !hasStarterGrant();
        if (grant) markStarterGrant();
        set((s) => ({
          username: name,
          hasOnboarded: true,
          coins: s.coins + (grant ? Config.STARTER_COINS : 0),
          ssr: { ...s.ssr, classic: clampSSR(placementSSR) },
          energy: Config.ENERGY_CAP,
          last_energy_refill_ts: now,
        }));
      },
```

4. After `addXPAndCoins` add:

```ts
      spendCoins: (amount) => {
        if (!Number.isInteger(amount) || amount < 0) return false;
        let ok = false;
        set((s) => {
          if (s.coins < amount) return {};
          ok = true;
          return { coins: s.coins - amount };
        });
        return ok;
      },
```

5. Replace the `recordPlay` implementation with:

```ts
      recordPlay: (today = todayISO()) =>
        set((s) => ({
          daily_streak: nextStreak(s.daily_streak, s.last_played_date, today),
          // Keep the later date so a clock rewind cannot lower it and farm the streak.
          last_played_date: laterDate(s.last_played_date, today),
        })),
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/services/starter.test.ts src/store/profileStore.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Checkpoint**

Run: `npx vitest run`
Expected: all green. Then the owner commits.

---

### Task 18: Graduation guard, once-only bonus, 24h fail cooldown

**Files:**
- Modify: `src/services/graduation.ts`, `src/services/graduation.test.ts`, `src/store/profileStore.ts`, `src/store/profileStore.test.ts`

**Interfaces:**
- Consumes: `Config.GRADUATION_FAIL_COOLDOWN_MS`, `processGraduationResult`.
- Produces:
  - `cooldownRemainingMs(failTs: number | undefined, now: number): number` in `graduation.ts` (0 when none; never more than the cooldown even after a clock rewind).
  - Profile field `graduation_fail_ts: Partial<Record<CollectionId, number>>` (initial `{}`).
  - `graduate(collection, date?)` no longer overwrites an existing graduation.
  - `completeGraduationExam(collection: CollectionId, score: number, total?: number, now?: number, today?: string): GraduationResult | null`. Returns `null` for an unknown collection or while the fail cooldown is active (no state change). Pass: awards `GRADUATION_XP_BONUS` and `GRADUATION_COIN_BONUS` and records the graduation only if `graduations[collection]` is unset; a repeat pass returns the result with `xpBonus: 0, coinBonus: 0`. First-time fail: stores `graduation_fail_ts[collection] = now`. These bonuses bypass the daily cap.

- [ ] **Step 1: Write the failing tests**

Append to `src/services/graduation.test.ts` (add `cooldownRemainingMs` to the import; add `Config` import `import { Config } from '../config';` if absent):

```ts
describe('cooldownRemainingMs', () => {
  const DAY = 24 * 60 * 60 * 1000;
  it('is 0 when there was no failure', () => {
    expect(cooldownRemainingMs(undefined, 1000)).toBe(0);
  });
  it('counts down 24 hours after a failure', () => {
    expect(cooldownRemainingMs(1000, 1000)).toBe(DAY);
    expect(cooldownRemainingMs(1000, 1000 + DAY - 1)).toBe(1);
    expect(cooldownRemainingMs(1000, 1000 + DAY)).toBe(0);
  });
  it('never exceeds 24 hours when the clock moved back', () => {
    expect(cooldownRemainingMs(10 * DAY, 0)).toBe(DAY);
  });
});
```

Append inside the `describe('profileStore', ...)` block of `src/store/profileStore.test.ts`:

```ts
  it('graduate() never overwrites an existing graduation date', () => {
    useProfileStore.getState().graduate('classic', '2026-11-12');
    useProfileStore.getState().graduate('classic', '2026-11-20');
    expect(useProfileStore.getState().graduations).toEqual({ classic: '2026-11-12' });
  });

  it('a passed exam pays the graduation bonus once per collection', () => {
    const s = useProfileStore.getState();
    const first = s.completeGraduationExam('classic', 18, 20, 0, '2026-11-12');
    expect(first).toMatchObject({ passed: true, xpBonus: 1000, coinBonus: 400 });
    expect(useProfileStore.getState().xp).toBe(1000);
    expect(useProfileStore.getState().coins).toBe(400);
    expect(useProfileStore.getState().graduations.classic).toBe('2026-11-12');

    const second = useProfileStore.getState().completeGraduationExam('classic', 20, 20, 1, '2026-11-13');
    expect(second).toMatchObject({ passed: true, xpBonus: 0, coinBonus: 0 });
    expect(useProfileStore.getState().xp).toBe(1000);
    expect(useProfileStore.getState().coins).toBe(400);
    expect(useProfileStore.getState().graduations.classic).toBe('2026-11-12');
  });

  it('a failed exam starts a 24 hour cooldown', () => {
    const DAY = 24 * 60 * 60 * 1000;
    const fail = useProfileStore.getState().completeGraduationExam('classic', 5, 20, 1000, '2026-11-12');
    expect(fail).toMatchObject({ passed: false });
    expect(useProfileStore.getState().graduation_fail_ts.classic).toBe(1000);
    expect(useProfileStore.getState().graduations.classic).toBeUndefined();

    expect(useProfileStore.getState().completeGraduationExam('classic', 20, 20, 1000 + DAY - 1, '2026-11-13')).toBeNull();
    expect(useProfileStore.getState().xp).toBe(0);

    const retry = useProfileStore.getState().completeGraduationExam('classic', 20, 20, 1000 + DAY, '2026-11-13');
    expect(retry).toMatchObject({ passed: true, xpBonus: 1000 });
  });

  it('completeGraduationExam ignores an unknown collection', () => {
    expect(useProfileStore.getState().completeGraduationExam('bogus' as unknown as CollectionId, 20, 20)).toBeNull();
  });
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/services/graduation.test.ts src/store/profileStore.test.ts`
Expected: FAIL (`cooldownRemainingMs` missing; `completeGraduationExam is not a function`).

- [ ] **Step 3: Implement**

Append to `src/services/graduation.ts`:

```ts
/** Milliseconds left on the post-failure cooldown. Capped at the cooldown so a rewound clock cannot lock a player out for long. */
export function cooldownRemainingMs(failTs: number | undefined, now: number): number {
  if (failTs == null || !Number.isFinite(failTs)) return 0;
  const cooldown = Config.GRADUATION_FAIL_COOLDOWN_MS;
  return Math.min(cooldown, Math.max(0, failTs + cooldown - now));
}
```

In `src/store/profileStore.ts`:
1. Add imports: `import { cooldownRemainingMs, processGraduationResult, type GraduationResult } from '../services/graduation';`
2. `Profile`: add `graduation_fail_ts: Partial<Record<CollectionId, number>>;` after `graduations`. In `createInitialProfile` add `graduation_fail_ts: {},` after `graduations: {},`.
3. `ProfileActions`: add `completeGraduationExam(collection: CollectionId, score: number, total?: number, now?: number, today?: string): GraduationResult | null;`
4. Replace `graduate` with:

```ts
      graduate: (collection, date = todayISO()) =>
        set((s) => {
          if (!Object.hasOwn(COLLECTIONS, collection) || s.graduations[collection]) return {};
          return { graduations: { ...s.graduations, [collection]: date } };
        }),

      completeGraduationExam: (
        collection,
        score,
        total = Config.GRADUATION_EXAM_WORDS,
        now = Date.now(),
        today = todayISO(),
      ) => {
        if (!Object.hasOwn(COLLECTIONS, collection)) return null;
        const s = get();
        if (cooldownRemainingMs(s.graduation_fail_ts[collection], now) > 0) return null;
        const result = processGraduationResult(score, total);
        const firstTime = !s.graduations[collection];
        if (!result.passed) {
          if (firstTime) set({ graduation_fail_ts: { ...s.graduation_fail_ts, [collection]: now } });
          return result;
        }
        if (!firstTime) return { ...result, xpBonus: 0, coinBonus: 0 };
        const { [collection]: _cleared, ...restFails } = s.graduation_fail_ts;
        set({
          xp: s.xp + result.xpBonus,
          coins: s.coins + result.coinBonus,
          graduations: { ...s.graduations, [collection]: today },
          graduation_fail_ts: restFails,
        });
        return result;
      },
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/services/graduation.test.ts src/store/profileStore.test.ts && npx tsc --noEmit`
Expected: PASS. The existing test `records graduation per collection` still passes (first graduation).

- [ ] **Step 5: Checkpoint**

Run: `npx vitest run`
Expected: all green. Then the owner commits.

---

### Task 19: Coin refill limits, hint purchase, charge energy at round start

**Files:**
- Modify: `src/store/profileStore.ts`, `src/store/profileStore.test.ts`

**Interfaces:**
- Consumes: `hintPrice`, `refillPrice` (Task 14), `calculateEnergyRefill`, `deductEnergy` service, `COLLECTIONS[id].energyCost`, `spendCoins` (Task 17).
- Produces:
  - Profile fields `refill_count: number` and `refill_date: string` (initial `0` and `''`).
  - `refillWithCoins(skill: number, now?: number, today?: string): boolean`: allowed only when energy (after natural refill) is at most `REFILL_MAX_ENERGY` (1), fewer than `REFILL_MAX_PER_DAY` (2) refills happened on `today`, and the player can pay `refillPrice(skill)`; sets energy to full, resets the energy timer, counts it. Atomic.
  - `buyHint(skill: number): boolean` spends `hintPrice(skill)` through `spendCoins`.
  - `startRound(collection: CollectionId, now?: number): boolean`: deducts `COLLECTIONS[collection].energyCost` pips atomically (refilling naturally first); returns false with no deduction when energy is short or the collection is unknown. Call it when a round starts; practise mode never calls it.

- [ ] **Step 1: Write the failing tests**

Append inside `describe('profileStore', ...)` in `src/store/profileStore.test.ts`:

```ts
  it('startRound charges the collection energy cost atomically', () => {
    expect(useProfileStore.getState().startRound('classic', 0)).toBe(true);
    expect(useProfileStore.getState().energy).toBe(4);
    useProfileStore.setState({ energy: 0, last_energy_refill_ts: 0 });
    expect(useProfileStore.getState().startRound('classic', 0)).toBe(false);
    expect(useProfileStore.getState().energy).toBe(0);
  });

  it('startRound ignores an unknown collection', () => {
    expect(useProfileStore.getState().startRound('bogus' as unknown as CollectionId, 0)).toBe(false);
    expect(useProfileStore.getState().energy).toBe(5);
  });

  it('buyHint spends the derived hint price or does nothing', () => {
    useProfileStore.setState({ coins: 6 });
    expect(useProfileStore.getState().buyHint(1100)).toBe(true); // price 6
    expect(useProfileStore.getState().coins).toBe(0);
    expect(useProfileStore.getState().buyHint(1100)).toBe(false);
    expect(useProfileStore.getState().coins).toBe(0);
  });

  describe('refillWithCoins', () => {
    const today = '2026-11-13';

    it('refills at 8b coins when energy is 1 or less', () => {
      useProfileStore.setState({ coins: 200, energy: 1, last_energy_refill_ts: 0 });
      expect(useProfileStore.getState().refillWithCoins(1100, 0, today)).toBe(true);
      const s = useProfileStore.getState();
      expect(s.coins).toBe(120); // 80 for skill 1100
      expect(s.energy).toBe(5);
      expect(s.refill_count).toBe(1);
      expect(s.refill_date).toBe(today);
    });

    it('refuses when energy is above 1', () => {
      useProfileStore.setState({ coins: 200, energy: 2, last_energy_refill_ts: 0 });
      expect(useProfileStore.getState().refillWithCoins(1100, 0, today)).toBe(false);
      expect(useProfileStore.getState().coins).toBe(200);
    });

    it('refuses when the player cannot pay, without a partial spend', () => {
      useProfileStore.setState({ coins: 79, energy: 0, last_energy_refill_ts: 0 });
      expect(useProfileStore.getState().refillWithCoins(1100, 0, today)).toBe(false);
      expect(useProfileStore.getState().coins).toBe(79);
      expect(useProfileStore.getState().energy).toBe(0);
    });

    it('allows at most 2 per day and resets the count on a new day', () => {
      useProfileStore.setState({ coins: 1000, energy: 0, last_energy_refill_ts: 0 });
      expect(useProfileStore.getState().refillWithCoins(1100, 0, today)).toBe(true);
      useProfileStore.setState({ energy: 0 });
      expect(useProfileStore.getState().refillWithCoins(1100, 0, today)).toBe(true);
      useProfileStore.setState({ energy: 0 });
      expect(useProfileStore.getState().refillWithCoins(1100, 0, today)).toBe(false);
      expect(useProfileStore.getState().coins).toBe(840);
      expect(useProfileStore.getState().refillWithCoins(1100, 0, '2026-11-14')).toBe(true);
      expect(useProfileStore.getState().refill_count).toBe(1);
    });
  });
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/store/profileStore.test.ts`
Expected: FAIL (`startRound is not a function`, etc.).

- [ ] **Step 3: Implement**

In `src/store/profileStore.ts`:
1. Add import `import { hintPrice, refillPrice } from '../services/economy';`
2. `Profile`: add after `graduation_fail_ts`:

```ts
  refill_count: number;
  refill_date: string;
```
   and in `createInitialProfile` after `graduation_fail_ts: {},` add `refill_count: 0,` and `refill_date: '',`.
3. `ProfileActions`: add

```ts
  buyHint(skill: number): boolean;
  refillWithCoins(skill: number, now?: number, today?: string): boolean;
  startRound(collection: CollectionId, now?: number): boolean;
```
4. After `spendCoins` add:

```ts
      buyHint: (skill) => get().spendCoins(hintPrice(skill)),

      refillWithCoins: (skill, now = Date.now(), today = todayISO()) => {
        let ok = false;
        set((s) => {
          const natural = calculateEnergyRefill(s.energy, s.last_energy_refill_ts, now);
          const keepNatural = { energy: natural.energy, last_energy_refill_ts: natural.lastRefillTs };
          const used = s.refill_date === today ? s.refill_count : 0;
          if (natural.energy > Config.REFILL_MAX_ENERGY || used >= Config.REFILL_MAX_PER_DAY) return keepNatural;
          const price = refillPrice(skill);
          if (s.coins < price) return keepNatural;
          ok = true;
          return {
            coins: s.coins - price,
            energy: Config.ENERGY_CAP,
            last_energy_refill_ts: now,
            refill_count: used + 1,
            refill_date: today,
          };
        });
        return ok;
      },

      startRound: (collection, now = Date.now()) => {
        if (!Object.hasOwn(COLLECTIONS, collection)) return false;
        const cost = COLLECTIONS[collection].energyCost;
        let ok = false;
        set((s) => {
          const r = deductEnergyPips(s.energy, cost, s.last_energy_refill_ts, now);
          ok = r.success;
          return { energy: r.energy, last_energy_refill_ts: r.lastRefillTs };
        });
        return ok;
      },
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/store/profileStore.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Checkpoint**

Run: `npx vitest run`
Expected: all green. Then the owner commits.

---

### Task 20: Round rewards with the daily cap, and the once-per-day daily claim

**Files:**
- Modify: `src/store/profileStore.ts`, `src/store/profileStore.test.ts`

**Interfaces:**
- Consumes: `applyDailyCap`, `canClaimDaily`, `RewardResult`, `DailyEarned` (Task 16).
- Produces:
  - Profile fields `last_daily_date: string`, `daily_earned: { coins: number; xp: number }`, `daily_date: string` (initial `''`, `{ coins: 0, xp: 0 }`, `''`).
  - `applyRoundReward(reward: RewardResult, today?: string): RewardResult`: applies the daily cap, adds the granted XP and coins to the profile, updates `daily_earned` and `daily_date`, returns what was actually granted.
  - `claimDaily(today?: string): boolean`: true once per local day (sets `last_daily_date`); callers pass `isDailyChallenge` to `calculateReward` only for the daily-challenge words, only when `canClaimDaily(last_daily_date, today)` is true, and call `claimDaily` when the daily challenge completes.

- [ ] **Step 1: Write the failing tests**

Append inside `describe('profileStore', ...)`:

```ts
  describe('applyRoundReward', () => {
    const today = '2026-11-13';

    it('adds the reward and tracks what was earned today', () => {
      const granted = useProfileStore.getState().applyRoundReward({ xp: 22, coins: 11 }, today);
      expect(granted).toEqual({ xp: 22, coins: 11 });
      const s = useProfileStore.getState();
      expect(s.xp).toBe(22);
      expect(s.coins).toBe(11);
      expect(s.daily_earned).toEqual({ coins: 11, xp: 22 });
      expect(s.daily_date).toBe(today);
    });

    it('pays 25% above the daily cap', () => {
      useProfileStore.setState({ daily_earned: { coins: 600, xp: 1200 }, daily_date: today });
      const granted = useProfileStore.getState().applyRoundReward({ xp: 40, coins: 20 }, today);
      expect(granted).toEqual({ xp: 10, coins: 5 });
      expect(useProfileStore.getState().coins).toBe(5);
    });

    it('starts a fresh allowance on a new local day', () => {
      useProfileStore.setState({ daily_earned: { coins: 600, xp: 1200 }, daily_date: '2026-11-12' });
      const granted = useProfileStore.getState().applyRoundReward({ xp: 22, coins: 11 }, today);
      expect(granted).toEqual({ xp: 22, coins: 11 });
    });
  });

  it('claimDaily succeeds once per local day and not after a clock rewind', () => {
    expect(useProfileStore.getState().claimDaily('2026-11-13')).toBe(true);
    expect(useProfileStore.getState().claimDaily('2026-11-13')).toBe(false);
    expect(useProfileStore.getState().claimDaily('2026-11-10')).toBe(false);
    expect(useProfileStore.getState().last_daily_date).toBe('2026-11-13');
    expect(useProfileStore.getState().claimDaily('2026-11-14')).toBe(true);
  });
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/store/profileStore.test.ts`
Expected: FAIL (`applyRoundReward is not a function`).

- [ ] **Step 3: Implement**

In `src/store/profileStore.ts`:
1. Change the economy import to `import { applyDailyCap, canClaimDaily, hintPrice, refillPrice, type DailyEarned, type RewardResult } from '../services/economy';`
2. `Profile`: add after `refill_date`:

```ts
  last_daily_date: string;
  daily_earned: DailyEarned;
  daily_date: string;
```
   and in `createInitialProfile` after `refill_date: '',` add `last_daily_date: '',`, `daily_earned: { coins: 0, xp: 0 },`, `daily_date: '',`.
3. `ProfileActions`: add

```ts
  applyRoundReward(reward: RewardResult, today?: string): RewardResult;
  claimDaily(today?: string): boolean;
```
4. After `buyHint` add:

```ts
      applyRoundReward: (reward, today = todayISO()) => {
        let granted: RewardResult = { xp: 0, coins: 0 };
        set((s) => {
          const r = applyDailyCap(reward, s.daily_earned, s.daily_date, today);
          granted = r.reward;
          return {
            xp: s.xp + r.reward.xp,
            coins: s.coins + r.reward.coins,
            daily_earned: r.earned,
            daily_date: r.date,
          };
        });
        return granted;
      },

      claimDaily: (today = todayISO()) => {
        let ok = false;
        set((s) => {
          if (!canClaimDaily(s.last_daily_date, today)) return {};
          ok = true;
          return { last_daily_date: today };
        });
        return ok;
      },
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/store/profileStore.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Checkpoint**

Run: `npx vitest run`
Expected: all green. Then the owner commits.

---

## Phase D: Persistence

### Task 21: Version 2 migration, history cap, quota-safe storage, cross-tab sync, docs

**Files:**
- Create: `src/store/migrate.ts`, `src/store/safeStorage.ts`, `src/store/crossTab.ts`
- Modify: `src/services/wordbank.ts`, `src/services/wordbank.test.ts`, `src/store/profileStore.ts`, `src/store/settingsStore.ts`, `src/main.tsx`, `src/store/profileStore.test.ts`, `README.md` (repo root)
- Test: `src/store/migrate.test.ts`, `src/store/safeStorage.test.ts`, `src/store/crossTab.test.ts`

**Interfaces:**
- Consumes: the final Profile shape (see top), `markStarterGrant` (Task 17), `Config.WORD_HISTORY_CAP` (Task 14).
- Produces:
  - `capHistory(history: string[], cap: number): string[]` in `wordbank.ts` (newest `cap` ids kept).
  - `migrateProfile(persisted: unknown, version: number): Record<string, unknown>` and `PROFILE_VERSION = 2` in `store/migrate.ts`. For `version < 2` it fills and type-checks the new fields (`graduation_fail_ts`, `refill_count`, `refill_date`, `last_daily_date`, `daily_earned`, `daily_date`) and, if `hasOnboarded` is true, marks the starter grant so a migrated player is never granted starter coins again.
  - `safeStorage: StateStorage` in `store/safeStorage.ts` (swallows write errors such as `QuotaExceededError`, `console.warn`s) and `storageChangedElsewhere(key: string): boolean` (true when the stored string differs from the last string this tab read or wrote).
  - `installCrossTabSync(): () => void` in `store/crossTab.ts` (rehydrates both stores on the `storage` event for their keys; returns an uninstall function).
  - `profileStore`: `version: 2`, `migrate`, persists through `safeStorage`; `addWordToHistory` caps history at `Config.WORD_HISTORY_CAP`; `spendCoins`, `startRound`, `refillWithCoins` and `completeGraduationExam` first rehydrate when another tab changed the stored profile (so spends use fresh coins and energy).

- [ ] **Step 1: Write the failing tests**

Append to `src/services/wordbank.test.ts` (add `capHistory` to its import; add `describe` to the vitest import if missing):

```ts
describe('capHistory', () => {
  it('keeps the newest ids up to the cap', () => {
    expect(capHistory(['a', 'b', 'c', 'd'], 2)).toEqual(['c', 'd']);
  });
  it('leaves short lists untouched', () => {
    const list = ['a', 'b'];
    expect(capHistory(list, 5)).toBe(list);
  });
});
```

Create `src/store/migrate.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { hasStarterGrant } from '../services/starter';
import { PROFILE_VERSION, migrateProfile } from './migrate';

beforeEach(() => localStorage.clear());

describe('migrateProfile', () => {
  it('is version 2', () => {
    expect(PROFILE_VERSION).toBe(2);
  });

  it('adds the new fields to a version 1 profile and keeps old data', () => {
    const out = migrateProfile({ xp: 99, coins: 7 }, 1);
    expect(out).toMatchObject({
      xp: 99,
      coins: 7,
      graduation_fail_ts: {},
      refill_count: 0,
      refill_date: '',
      last_daily_date: '',
      daily_earned: { coins: 0, xp: 0 },
      daily_date: '',
    });
  });

  it('replaces wrong-typed new fields', () => {
    const out = migrateProfile({ refill_count: 'x', daily_earned: null, graduation_fail_ts: 5 }, 1);
    expect(out).toMatchObject({ refill_count: 0, daily_earned: { coins: 0, xp: 0 }, graduation_fail_ts: {} });
  });

  it('survives non-object input', () => {
    expect(migrateProfile(null, 1)).toMatchObject({ refill_count: 0 });
  });

  it('marks the starter grant for an already onboarded player', () => {
    migrateProfile({ hasOnboarded: true }, 1);
    expect(hasStarterGrant()).toBe(true);
  });

  it('does not touch a current-version state', () => {
    const state = { xp: 1 };
    expect(migrateProfile(state, 2)).toEqual({ xp: 1 });
  });
});
```

Create `src/store/safeStorage.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { safeStorage, storageChangedElsewhere } from './safeStorage';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('safeStorage', () => {
  it('reads and writes like localStorage', () => {
    safeStorage.setItem('k', 'v');
    expect(safeStorage.getItem('k')).toBe('v');
    safeStorage.removeItem('k');
    expect(safeStorage.getItem('k')).toBeNull();
  });

  it('swallows a quota error on write', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(() => safeStorage.setItem('k', 'v')).not.toThrow();
  });

  it('detects a change written by another tab', () => {
    safeStorage.setItem('k', 'one');
    expect(storageChangedElsewhere('k')).toBe(false);
    localStorage.setItem('k', 'two'); // another tab
    expect(storageChangedElsewhere('k')).toBe(true);
  });

  it('does not report a change after a failed write', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    safeStorage.setItem('k', 'one');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    safeStorage.setItem('k', 'two');
    expect(storageChangedElsewhere('k')).toBe(false);
  });
});
```

Create `src/store/crossTab.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { installCrossTabSync } from './crossTab';
import { useProfileStore } from './profileStore';

beforeEach(() => {
  localStorage.clear();
  useProfileStore.getState().reset(0);
});

function otherTabWrites(coins: number) {
  const raw = JSON.parse(localStorage.getItem('sabispell:profile')!);
  raw.state.coins = coins;
  localStorage.setItem('sabispell:profile', JSON.stringify(raw));
}

describe('cross-tab sync', () => {
  it('rehydrates when another tab writes the profile', () => {
    const uninstall = installCrossTabSync();
    useProfileStore.setState({ coins: 5 });
    otherTabWrites(50);
    window.dispatchEvent(new StorageEvent('storage', { key: 'sabispell:profile' }));
    expect(useProfileStore.getState().coins).toBe(50);
    uninstall();
  });

  it('ignores unrelated keys', () => {
    const uninstall = installCrossTabSync();
    useProfileStore.setState({ coins: 5 });
    otherTabWrites(50);
    window.dispatchEvent(new StorageEvent('storage', { key: 'something-else' }));
    expect(useProfileStore.getState().coins).toBe(5);
    uninstall();
  });

  it('spends use fresh coins even before the storage event arrives', () => {
    useProfileStore.setState({ coins: 5 });
    otherTabWrites(50); // event not delivered yet
    expect(useProfileStore.getState().spendCoins(40)).toBe(true);
    expect(useProfileStore.getState().coins).toBe(10);
  });
});
```

Append inside `describe('profileStore', ...)` in `src/store/profileStore.test.ts`:

```ts
  it('caps word history per collection, keeping the newest', () => {
    for (let i = 0; i < 505; i++) useProfileStore.getState().addWordToHistory('classic', `w${i}`);
    const h = useProfileStore.getState().word_history.classic;
    expect(h).toHaveLength(500);
    expect(h[0]).toBe('w5');
    expect(h[499]).toBe('w504');
  });

  it('migrates a version 1 profile and fills the new fields', async () => {
    localStorage.setItem(
      'sabispell:profile',
      JSON.stringify({ state: { xp: 10, coins: 3, hasOnboarded: true }, version: 1 }),
    );
    await useProfileStore.persist.rehydrate();
    const s = useProfileStore.getState();
    expect(s.xp).toBe(10);
    expect(s.refill_count).toBe(0);
    expect(s.daily_earned).toEqual({ coins: 0, xp: 0 });
    expect(s.graduation_fail_ts).toEqual({});
  });

  it('drops wrong-typed new fields already stored at version 2', async () => {
    localStorage.setItem(
      'sabispell:profile',
      JSON.stringify({
        state: { daily_earned: 'x', graduation_fail_ts: { classic: 'y', yoruba: 5 } },
        version: 2,
      }),
    );
    await useProfileStore.persist.rehydrate();
    const s = useProfileStore.getState();
    expect(s.daily_earned).toEqual({ coins: 0, xp: 0 });
    expect(s.graduation_fail_ts).toEqual({ yoruba: 5 });
  });

  it('does not throw when localStorage is full', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => useProfileStore.getState().addXPAndCoins(5, 5)).not.toThrow();
    expect(useProfileStore.getState().xp).toBe(5);
    spy.mockRestore();
    warn.mockRestore();
  });
```

(Add `vi` to the file's vitest import: `import { beforeEach, describe, expect, it, vi } from 'vitest';`.)

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/services/wordbank.test.ts src/store`
Expected: FAIL (cannot resolve `./migrate`, `./safeStorage`, `./crossTab`; `capHistory` missing).

- [ ] **Step 3: Implement**

Append to `src/services/wordbank.ts`:

```ts
/** Keeps the newest `cap` ids so localStorage does not grow without bound. */
export function capHistory(history: string[], cap: number): string[] {
  return history.length > cap ? history.slice(history.length - cap) : history;
}
```

Create `src/store/migrate.ts`:

```ts
import { markStarterGrant } from '../services/starter';

export const PROFILE_VERSION = 2;

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Migrates a stored profile to the current version. Pure apart from marking the starter-coin flag. */
export function migrateProfile(persisted: unknown, version: number): Record<string, unknown> {
  const state: Record<string, unknown> = isObj(persisted) ? { ...persisted } : {};
  if (version < 2) {
    if (!isObj(state.graduation_fail_ts)) state.graduation_fail_ts = {};
    if (!isNum(state.refill_count)) state.refill_count = 0;
    if (typeof state.refill_date !== 'string') state.refill_date = '';
    if (typeof state.last_daily_date !== 'string') state.last_daily_date = '';
    if (!(isObj(state.daily_earned) && isNum(state.daily_earned.coins) && isNum(state.daily_earned.xp))) {
      state.daily_earned = { coins: 0, xp: 0 };
    }
    if (typeof state.daily_date !== 'string') state.daily_date = '';
    // Existing players already received their starter coins; never grant them again.
    if (state.hasOnboarded === true) markStarterGrant();
  }
  return state;
}
```

Create `src/store/safeStorage.ts`:

```ts
import type { StateStorage } from 'zustand/middleware';

// Last raw string this tab read or successfully wrote, per key. Used to spot writes from other tabs.
const lastRaw = new Map<string, string | null>();

export const safeStorage: StateStorage = {
  getItem: (key) => {
    try {
      const raw = localStorage.getItem(key);
      lastRaw.set(key, raw);
      return raw;
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
      lastRaw.set(key, value);
    } catch (error) {
      // QuotaExceededError or blocked storage: keep playing with in-memory state.
      console.warn('SabiSpell could not save progress to this device.', error);
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      lastRaw.set(key, null);
    } catch {
      // ignore
    }
  },
};

/** True when the stored value differs from what this tab last saw, meaning another tab wrote it. */
export function storageChangedElsewhere(key: string): boolean {
  try {
    return lastRaw.has(key) && localStorage.getItem(key) !== lastRaw.get(key);
  } catch {
    return false;
  }
}
```

Create `src/store/crossTab.ts`:

```ts
import { Config } from '../config';
import { useProfileStore } from './profileStore';
import { useSettingsStore } from './settingsStore';

/** Keeps this tab's stores in step with writes from other tabs. Returns an uninstall function. */
export function installCrossTabSync(): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === Config.STORAGE_KEYS.PROFILE) void useProfileStore.persist.rehydrate();
    if (e.key === Config.STORAGE_KEYS.SETTINGS) void useSettingsStore.persist.rehydrate();
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}
```

In `src/store/settingsStore.ts` change `storage: createJSONStorage(() => localStorage),` to `storage: createJSONStorage(() => safeStorage),` and add `import { safeStorage } from './safeStorage';`.

In `src/store/profileStore.ts`:
1. Add imports:

```ts
import { capHistory, updateWordHistory } from '../services/wordbank';
import { PROFILE_VERSION, migrateProfile } from './migrate';
import { safeStorage, storageChangedElsewhere } from './safeStorage';
```
   (replace the existing `import { updateWordHistory } from '../services/wordbank';`).
2. Above `export const useProfileStore`, add:

```ts
// Another tab may have spent coins or energy since this tab last read storage. Reload before any spend.
function syncFromStorage(): void {
  if (storageChangedElsewhere(Config.STORAGE_KEYS.PROFILE)) void useProfileStore.persist.rehydrate();
}
```
3. Add `syncFromStorage();` as the first statement of `spendCoins` (before the `Number.isInteger` guard is fine; put it after the guard), `startRound` (first line of the body), `refillWithCoins` (first line), and `completeGraduationExam` (first line, before `const s = get();`). Note `buyHint` is covered through `spendCoins`.
4. In `addWordToHistory` replace `[collection]: updateWordHistory(s.word_history[collection], wordId),` with `[collection]: capHistory(updateWordHistory(s.word_history[collection], wordId), Config.WORD_HISTORY_CAP),`.
5. Persist options: replace the comment-and-version lines and storage with:

```ts
      name: Config.STORAGE_KEYS.PROFILE,
      version: PROFILE_VERSION,
      migrate: (persisted, version) => migrateProfile(persisted, version) as unknown as Profile & ProfileActions,
      storage: createJSONStorage(() => safeStorage),
```
6. In `merge`, after the `graduations: pickValid(...)` entry, add:

```ts
          graduation_fail_ts: pickValid(
            current.graduation_fail_ts,
            saved.graduation_fail_ts,
            (v) => typeof v === 'number' && Number.isFinite(v),
          ),
          daily_earned:
            saved.daily_earned &&
            typeof saved.daily_earned === 'object' &&
            Number.isFinite((saved.daily_earned as { coins?: unknown }).coins) &&
            Number.isFinite((saved.daily_earned as { xp?: unknown }).xp)
              ? (saved.daily_earned as Profile['daily_earned'])
              : current.daily_earned,
```

In `src/main.tsx` add `import { installCrossTabSync } from './store/crossTab';` and call `installCrossTabSync();` on its own line directly before `createRoot(...)`.

In `README.md` (repo root) replace the Documentation list with:

```markdown
## Documentation

- [Product requirements and roadmap](docs/PRODUCT.md)
- [Design spec](docs/superpowers/specs/2026-11-12-full-product-design.md)
- [Phase 1 visual refresh spec](docs/superpowers/specs/2026-11-13-phase-1-visual-refresh-design.md)
- [Phase 1 UI addendum (design, accessibility and economy rules)](docs/superpowers/specs/2026-11-13-phase-1-ui-addendum.md)
- [Phase 0 plan](docs/superpowers/plans/2026-11-12-phase-0-foundation.md)
- [Phase 1c-A plan (foundation)](docs/superpowers/plans/2026-11-13-phase-1c-a-foundation.md)
- [Archived MVP docs](docs/archive/)

The web app (`web/`) deploys to Vercel with `web/vercel.json`, which rewrites every route to `/index.html` so client-side routes survive a reload. Set the Vercel project root directory to `web`.
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS everywhere, including the existing rehydrate tests (stored `version: 1` states now go through `migrateProfile`). If an existing rehydrate test fails because a field is missing, fix `migrateProfile`/`merge`, never the test.

- [ ] **Step 5: Checkpoint**

Run: `npx vitest run && npm run build && ls dist`
Expected: all tests green; build succeeds; `dist/manifest.webmanifest` and `dist/sw.js` present. Then the owner commits.

---

## Self-Review Notes

- Spec coverage: router/shell/guard/vercel/nav/skip link/focus/Help slot/tints/widths (Tasks 11-13); every listed ui component (Tasks 5-10, Chip variants incl. streak-risk in 6; Toggle On/Off whole-row in 8; Modal in 9; UsernameInput in 10); icons verified and mapped with the missing backspace noted (Task 2); tokens, focus ring, forced-colors, reduced motion, sr-only, live region (Tasks 1, 3, 4); economy items (a) Task 17, (b) Task 18, (c) Task 17, (d) Tasks 14 and 19, (e) Tasks 15, 16 and 20, (f) Task 15, (g) Tasks 16 and 20, (h) Task 17, (i) Task 21, (j) Task 19, (k) Task 21; README (Task 21).
- Signature consistency: `spendCoins(amount)`, `buyHint(skill)`, `refillWithCoins(skill, now?, today?)`, `startRound(collection, now?)`, `applyRoundReward(reward, today?)`, `claimDaily(today?)`, `completeGraduationExam(collection, score, total?, now?, today?)` are declared once and used identically in tests. `Profile` fields match the "Final Profile shape" block and Task 21 migration.
- Test count: the 113 existing tests stay green; the intentional changes are the daily/streak reward test (Task 15) and the two starter-coin assertions (Task 17).
