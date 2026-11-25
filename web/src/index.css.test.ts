import { describe, expect, it } from 'vitest';
// Reads Tailwind-compiled CSS. Requires css.include for index.css in vite.config.ts
// (Vitest returns '' for CSS otherwise). Do not switch to ?raw, or a Tailwind upgrade
// may silently break these assertions.
import css from './index.css?inline';

describe('index.css accessibility base', () => {
  it('defines the new colour tokens with the addendum values', () => {
    for (const token of [
      /--color-border:\s*#dde6ef/,
      /--color-border-strong:\s*#7b8ea3/,
      /--color-page-tint:\s*#eaf4fc/,
      /--color-muted:\s*#5a6b7b/,
      /--color-text-gold:\s*#8a5a00/,
      /--color-success-text:\s*#1f7a43/,
      /--color-danger-text:\s*#b3261e/,
      /--color-streak:\s*#b35a0a/,
      /--color-danger-50:\s*#fdecea/,
    ]) {
      expect(css).toMatch(token);
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
