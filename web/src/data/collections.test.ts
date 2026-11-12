import { describe, expect, it } from 'vitest';
import { COLLECTION_IDS, COLLECTIONS, PROVERBS } from './collections';

describe('collections', () => {
  it('exposes classic and yoruba', () => {
    expect(COLLECTION_IDS).toEqual(['classic', 'yoruba']);
  });

  it('classic has at least 50 words, all tagged classic, unique ids, valid SSR', () => {
    const { words } = COLLECTIONS.classic;
    expect(words.length).toBeGreaterThanOrEqual(50);
    expect(words.every((w) => w.collection === 'classic')).toBe(true);
    expect(new Set(words.map((w) => w.id)).size).toBe(words.length);
    expect(words.every((w) => w.ssr >= 100 && w.ssr <= 2000)).toBe(true);
  });

  it('yoruba has 50 words tagged yoruba and 4 proverbs', () => {
    expect(COLLECTIONS.yoruba.words).toHaveLength(50);
    expect(COLLECTIONS.yoruba.words.every((w) => w.collection === 'yoruba')).toBe(true);
    expect(PROVERBS).toHaveLength(4);
  });

  it('no word keeps the legacy tier field', () => {
    for (const id of COLLECTION_IDS) {
      for (const w of COLLECTIONS[id].words) {
        expect('tier' in w).toBe(false);
      }
    }
  });

  it('uses the per-collection SSR start and K factor', () => {
    expect(COLLECTIONS.classic.startSSR).toBe(1100);
    expect(COLLECTIONS.classic.kFactor).toBe(24);
    expect(COLLECTIONS.yoruba.startSSR).toBe(100);
    expect(COLLECTIONS.yoruba.kFactor).toBe(32);
  });
});
