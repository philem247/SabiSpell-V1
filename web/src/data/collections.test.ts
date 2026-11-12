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

  it('yoruba has at least 50 words tagged yoruba and at least 4 proverbs', () => {
    expect(COLLECTIONS.yoruba.words.length).toBeGreaterThanOrEqual(50);
    expect(COLLECTIONS.yoruba.words.every((w) => w.collection === 'yoruba')).toBe(true);
    expect(PROVERBS.length).toBeGreaterThanOrEqual(4);
  });

  it('no word keeps the legacy tier field', () => {
    for (const id of COLLECTION_IDS) {
      for (const w of COLLECTIONS[id].words) {
        expect('tier' in w).toBe(false);
      }
    }
  });

  it('every word has the required fields', () => {
    for (const id of COLLECTION_IDS) {
      for (const w of COLLECTIONS[id].words) {
        const at = `${id}/${w.id}`;
        expect(typeof w.id, `${at} id`).toBe('string');
        expect(w.id.length, `${at} id non-empty`).toBeGreaterThan(0);
        expect(typeof w.text, `${at} text`).toBe('string');
        expect(w.text.length, `${at} text non-empty`).toBeGreaterThan(0);
        expect(typeof w.ssr, `${at} ssr`).toBe('number');
        expect(typeof w.definition, `${at} definition`).toBe('string');
        expect(typeof w.phonetic, `${at} phonetic`).toBe('string');
        expect(Array.isArray(w.context_sentences), `${at} context_sentences`).toBe(true);
      }
    }
  });

  it('word ids are unique across all collections', () => {
    const ids = COLLECTION_IDS.flatMap((id) => COLLECTIONS[id].words.map((w) => w.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses the per-collection SSR start and K factor', () => {
    expect(COLLECTIONS.classic.startSSR).toBe(1100);
    expect(COLLECTIONS.classic.kFactor).toBe(24);
    expect(COLLECTIONS.yoruba.startSSR).toBe(100);
    expect(COLLECTIONS.yoruba.kFactor).toBe(32);
  });
});
