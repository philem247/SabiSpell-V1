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

  it('restarts on a malformed last-played date', () => {
    expect(nextStreak(4, 'not-a-date', '2026-11-12')).toBe(1);
  });

  it('restarts on a malformed today', () => {
    expect(nextStreak(4, '2026-11-11', 'tomorrow')).toBe(1);
  });

  it('restarts on an impossible last-played date', () => {
    expect(nextStreak(4, '2026-13-45', '2026-11-12')).toBe(1);
  });

  it('restarts on an impossible today (Feb 30)', () => {
    expect(nextStreak(4, '2026-11-11', '2026-02-30')).toBe(1);
  });

  it('accepts a leap day', () => {
    expect(nextStreak(2, '2028-02-28', '2028-02-29')).toBe(3);
  });

  it('keeps the streak when last-played is in the future (clock skew)', () => {
    expect(nextStreak(4, '2026-11-20', '2026-11-12')).toBe(4);
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
