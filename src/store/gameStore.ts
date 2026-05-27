import { create } from 'zustand';
import { Word } from '../services/wordbank';

export interface GameState {
  currentWord: Word | null;
  sessionWords: string[];
  sessionScore: number;
  spellStreak: number;
  isComplete: boolean;

  startNewSession: () => void;
  setCurrentWord: (word: Word) => void;
  recordAnswer: (isCorrect: boolean) => void;
  endSession: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentWord: null,
  sessionWords: [],
  sessionScore: 0,
  spellStreak: 0,
  isComplete: false,

  startNewSession: () => {
    set({
      currentWord: null,
      sessionWords: [],
      sessionScore: 0,
      spellStreak: 0,
      isComplete: false,
    });
  },

  setCurrentWord: (word) => {
    set((state) => ({
      currentWord: word,
      sessionWords: state.sessionWords.includes(word.id)
        ? state.sessionWords
        : [...state.sessionWords, word.id],
    }));
  },

  recordAnswer: (isCorrect) => {
    set((state) => {
      const nextScore = isCorrect ? state.sessionScore + 1 : state.sessionScore;
      const nextStreak = isCorrect ? state.spellStreak + 1 : 0;
      return {
        sessionScore: nextScore,
        spellStreak: nextStreak,
      };
    });
  },

  endSession: () => {
    set({ isComplete: true });
  },
}));
