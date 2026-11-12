import { describe, expect, it } from 'vitest';
import { getNextTitleXP, getXPTitle } from './titles';

describe('getXPTitle', () => {
  it('maps XP to titles at the boundaries', () => {
    expect(getXPTitle(0)).toBe('Recruit');
    expect(getXPTitle(2499)).toBe('Recruit');
    expect(getXPTitle(2500)).toBe('Cadet');
    expect(getXPTitle(6420)).toBe('Cadet');
    expect(getXPTitle(8000)).toBe('Scholar');
    expect(getXPTitle(40000)).toBe("VC's List");
  });

  it('treats negative XP as the lowest title', () => {
    expect(getXPTitle(-5)).toBe('Recruit');
  });
});

describe('getNextTitleXP', () => {
  it('returns the next threshold or null at the top', () => {
    expect(getNextTitleXP(6420)).toBe(8000);
    expect(getNextTitleXP(40000)).toBeNull();
  });

  it('returns the first threshold for negative XP', () => {
    expect(getNextTitleXP(-5)).toBe(2500);
  });
});
