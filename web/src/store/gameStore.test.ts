import { beforeEach, describe, expect, it } from 'vitest';
import type { Word } from '../types';
import { useGameStore } from './gameStore';

const word = (id: string): Word => ({
  id,
  text: id,
  ssr: 1100,
  collection: 'classic',
  language: 'en',
  definition: '',
  context_sentences: [],
  phonetic: '',
});

beforeEach(() => {
  useGameStore.getState().startNewSession();
});

describe('gameStore', () => {
  it('tracks words used this session once', () => {
    useGameStore.getState().setCurrentWord(word('a'));
    useGameStore.getState().setCurrentWord(word('a'));
    expect(useGameStore.getState().sessionWords).toEqual(['a']);
  });

  it('scores answers and builds the spell streak', () => {
    const g = useGameStore.getState();
    g.setCurrentWord(word('a'));
    g.recordAnswer(true, 'a');
    g.setCurrentWord(word('b'));
    g.recordAnswer(true, 'b');
    expect(useGameStore.getState().sessionScore).toBe(2);
    expect(useGameStore.getState().spellStreak).toBe(2);
    g.setCurrentWord(word('c'));
    g.recordAnswer(false, 'x');
    expect(useGameStore.getState().spellStreak).toBe(0);
    expect(useGameStore.getState().sessionHistory).toHaveLength(3);
  });

  it('ignores an answer when no word is active', () => {
    useGameStore.getState().recordAnswer(true, 'a');
    expect(useGameStore.getState().sessionHistory).toHaveLength(0);
  });

  it('marks the session complete and resets on a new one', () => {
    useGameStore.getState().endSession();
    expect(useGameStore.getState().isComplete).toBe(true);
    useGameStore.getState().startNewSession();
    expect(useGameStore.getState().isComplete).toBe(false);
  });
});
