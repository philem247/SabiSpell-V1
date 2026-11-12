import { Config } from '../config';
import type { Word } from '../types';
import { calculateSSRDelta, clampSSR } from './ssr';
import { getNextWord } from './wordbank';

export interface PlacementAnswer {
  wordSSR: number;
  isCorrect: boolean;
}

export function computePlacementSSR(
  answers: PlacementAnswer[],
  startSSR: number = Config.SSR_START,
): number {
  const start = Number.isFinite(startSSR) ? clampSSR(startSSR) : Config.SSR_START;
  return answers.reduce(
    (ssr, a) => ssr + calculateSSRDelta(ssr, a.wordSSR, a.isCorrect, Config.PLACEMENT_K_FACTOR),
    start,
  );
}

// Returns null once the pool is exhausted; callers end the placement early with the answers so far.
export function nextPlacementWord(
  currentSSR: number,
  words: Word[],
  usedIds: string[],
  rng?: () => number,
): Word | null {
  return getNextWord(currentSSR, words, usedIds, [], rng);
}
