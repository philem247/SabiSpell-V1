import { describe, expect, it } from 'vitest';
import { Config } from '../config';
import { COLLECTIONS } from '../data/collections';
import { calculateSSRDelta } from './ssr';
import { computePlacementSSR, nextPlacementWord } from './placement';

describe('computePlacementSSR', () => {
  it('returns the start SSR with no answers', () => {
    expect(computePlacementSSR([])).toBe(1100);
  });

  it('rises when every answer is correct on hard words', () => {
    const answers = Array.from({ length: 8 }, () => ({ wordSSR: 1300, isCorrect: true }));
    expect(computePlacementSSR(answers)).toBeGreaterThan(1100);
  });

  it('falls when every answer is wrong on easy words', () => {
    const answers = Array.from({ length: 8 }, () => ({ wordSSR: 900, isCorrect: false }));
    expect(computePlacementSSR(answers)).toBeLessThan(1100);
  });

  it('stays inside the SSR range', () => {
    const answers = Array.from({ length: 200 }, () => ({ wordSSR: 2000, isCorrect: true }));
    expect(computePlacementSSR(answers)).toBe(Config.SSR_MAX);
  });

  it('bottoms out at the SSR minimum', () => {
    const answers = Array.from({ length: 200 }, () => ({ wordSSR: 100, isCorrect: false }));
    expect(computePlacementSSR(answers)).toBe(Config.SSR_MIN);
  });

  it('clamps an out-of-range start', () => {
    expect(computePlacementSSR([], 5000)).toBe(2000);
    expect(computePlacementSSR([], -50)).toBe(100);
  });

  it('falls back to the default start for NaN', () => {
    expect(computePlacementSSR([], NaN)).toBe(1100);
  });
});

describe('placement simulation on the classic collection', () => {
  const run = (isCorrectFor: (ssr: number) => boolean) => {
    let ssr: number = Config.SSR_START;
    const used: string[] = [];
    for (let i = 0; i < Config.PLACEMENT_WORDS; i++) {
      const w = nextPlacementWord(ssr, COLLECTIONS.classic.words, used, () => 0);
      if (!w) throw new Error('ran out of words');
      used.push(w.id);
      ssr += calculateSSRDelta(ssr, w.ssr, isCorrectFor(w.ssr), Config.PLACEMENT_K_FACTOR);
    }
    return { ssr, used };
  };

  it('the classic collection has enough words to place a player', () => {
    expect(COLLECTIONS.classic.words.length).toBeGreaterThanOrEqual(Config.PLACEMENT_WORDS);
  });

  it('asks 8 distinct words', () => {
    const { used } = run(() => true);
    expect(used).toHaveLength(8);
    expect(new Set(used).size).toBe(8);
  });

  it('places a perfect player above a player who misses everything', () => {
    expect(run(() => true).ssr).toBeGreaterThan(run(() => false).ssr);
  });
});

describe('nextPlacementWord', () => {
  it('returns null when no words are left', () => {
    expect(nextPlacementWord(1100, [], [])).toBeNull();
  });
});
