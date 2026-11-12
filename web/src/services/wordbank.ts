import { Config } from '../config';
import { PROVERBS } from '../data/collections';
import type { Proverb, Word } from '../types';

export function getNextWord(
  playerSSR: number,
  words: Word[],
  sessionWords: string[],
  wordHistory: string[],
  rng: () => number = Math.random,
): Word | null {
  const pool = words.filter((w) => !sessionWords.includes(w.id));
  const windows = [Config.SSR_WORD_PROXIMITY, Config.SSR_WORD_PROXIMITY_WIDE, Infinity];

  for (const window of windows) {
    const near = pool.filter((w) => Math.abs(w.ssr - playerSSR) <= window);
    if (near.length === 0) continue;
    const fresh = near.filter((w) => !wordHistory.includes(w.id));
    const choices = fresh.length > 0 ? fresh : near;
    return choices[Math.floor(rng() * choices.length)];
  }
  return null;
}

export function getProverbForWord(wordId: string, proverbs: Proverb[] = PROVERBS): Proverb | null {
  return proverbs.find((p) => p.word_id === wordId) ?? null;
}

export function updateWordHistory(history: string[], wordId: string): string[] {
  return history.includes(wordId) ? history : [...history, wordId];
}

export function maskWordInSentence(sentence: string, word: string): string {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return sentence.replace(new RegExp(escaped, 'gi'), '_____');
}
