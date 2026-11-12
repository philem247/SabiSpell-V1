import { describe, expect, it } from 'vitest';
import { calculateReward } from './economy';

describe('calculateReward', () => {
  it('gives nothing for a wrong answer', () => {
    expect(calculateReward(1220, false, 10, true)).toEqual({ xp: 0, coins: 0 });
  });

  it('base reward: 5 + floor(ssr/200) coins, double in XP', () => {
    expect(calculateReward(1220, true, 0)).toEqual({ xp: 22, coins: 11 });
  });

  it('applies the streak tiers', () => {
    expect(calculateReward(1220, true, 3)).toEqual({ xp: 24, coins: 12 });
    expect(calculateReward(1220, true, 5)).toEqual({ xp: 28, coins: 14 });
  });

  it('streak below the first tier gives no bonus', () => {
    expect(calculateReward(1220, true, 2)).toEqual({ xp: 22, coins: 11 });
  });

  it('streak 4 still uses the 3-tier', () => {
    expect(calculateReward(1220, true, 4)).toEqual({ xp: 24, coins: 12 });
  });

  it('streak 9 still uses the 5-tier', () => {
    expect(calculateReward(1220, true, 9)).toEqual({ xp: 28, coins: 14 });
  });

  it('multiplies streak by the daily challenge bonus', () => {
    expect(calculateReward(1220, true, 10, true)).toEqual({ xp: 50, coins: 25 });
  });

  it('daily challenge alone is 1.5x', () => {
    expect(calculateReward(1220, true, 0, true)).toEqual({ xp: 33, coins: 17 });
  });
});
