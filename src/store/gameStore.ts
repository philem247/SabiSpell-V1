import { create } from 'zustand';
import { Word } from '../services/wordbank';

export interface SessionHistoryItem {
  word: Word;
  isCorrect: boolean;
  userInput: string;
}

export interface GameState {
  currentWord: Word | null;
  sessionWords: string[];
  sessionScore: number;
  spellStreak: number;
  isComplete: boolean;
  sessionHistory: SessionHistoryItem[];

  startNewSession: () => void;
  setCurrentWord: (word: Word) => void;
  recordAnswer: (isCorrect: boolean, userInput: string) => void;
  endSession: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentWord: null,
  sessionWords: [],
  sessionScore: 0,
  spellStreak: 0,
  isComplete: false,
  sessionHistory: [],

  startNewSession: () => {
    set({
      currentWord: null,
      sessionWords: [],
      sessionScore: 0,
      spellStreak: 0,
      isComplete: false,
      sessionHistory: [],
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

  recordAnswer: (isCorrect, userInput) => {
    set((state) => {
      const nextScore = isCorrect ? state.sessionScore + 1 : state.sessionScore;
      const nextStreak = isCorrect ? state.spellStreak + 1 : 0;
      const nextHistory = state.currentWord
        ? [...state.sessionHistory, { word: state.currentWord, isCorrect, userInput }]
        : state.sessionHistory;
      return {
        sessionScore: nextScore,
        spellStreak: nextStreak,
        sessionHistory: nextHistory,
      };
    });
  },

  endSession: () => {
    set({ isComplete: true });
  },
}));
