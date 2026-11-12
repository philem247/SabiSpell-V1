import { describe, expect, it } from 'vitest';
import type { Word } from '../types';
import { getNextWord, getProverbForWord, maskWordInSentence, updateWordHistory } from './wordbank';

const word = (id: string, ssr: number): Word => ({
  id,
  text: id,
  ssr,
  collection: 'classic',
  language: 'en',
  definition: '',
  context_sentences: [],
  phonetic: '',
});

const words = [word('a', 1000), word('b', 1100), word('c', 1250), word('d', 1900)];
const first = () => 0;
const last = () => 0.99;

describe('getNextWord', () => {
  it('picks within 300 SSR of the player', () => {
    expect(getNextWord(1100, words, [], [], first)?.id).toBe('a');
    expect(getNextWord(1100, words, [], [], last)?.id).toBe('c');
  });

  it('prefers words not seen before', () => {
    expect(getNextWord(1100, words, [], ['a', 'b'], first)?.id).toBe('c');
  });

  it('falls back to seen words when nothing fresh is in range', () => {
    expect(getNextWord(1100, words, [], ['a', 'b', 'c'], first)?.id).toBe('a');
  });

  it('skips words already used this session and widens the window', () => {
    expect(getNextWord(1100, words, ['a', 'b', 'c'], [], first)?.id).toBe('d');
  });

  it('returns null when every word is used', () => {
    expect(getNextWord(1100, words, ['a', 'b', 'c', 'd'], [], first)).toBeNull();
  });
});

describe('updateWordHistory', () => {
  it('appends once', () => {
    expect(updateWordHistory(['a'], 'b')).toEqual(['a', 'b']);
    expect(updateWordHistory(['a', 'b'], 'b')).toEqual(['a', 'b']);
  });
});

describe('maskWordInSentence', () => {
  it('masks case-insensitively', () => {
    expect(maskWordInSentence('The Aberration was odd', 'aberration')).toBe('The _____ was odd');
  });

  it('treats regex characters literally', () => {
    expect(maskWordInSentence('a.b and axb', 'a.b')).toBe('_____ and axb');
  });
});

describe('getProverbForWord', () => {
  it('finds the proverb for a Yoruba word', () => {
    expect(getProverbForWord('yw_012')?.id).toBe('yp_001');
  });

  it('returns null for words without one', () => {
    expect(getProverbForWord('sw_001')).toBeNull();
  });
});
