import { create } from 'zustand';
import type { Word } from '../types';

export interface SessionHistoryItem {
  word: Word;
  isCorrect: boolean;
  userInput: string;
}

interface GameState {
  currentWord: Word | null;
  sessionWords: string[];
  sessionScore: number;
  spellStreak: number;
  isComplete: boolean;
  sessionHistory: SessionHistoryItem[];
  startNewSession(): void;
  setCurrentWord(word: Word): void;
  recordAnswer(isCorrect: boolean, userInput: string): void;
  endSession(): void;
}

const emptySession = () => ({
  currentWord: null as Word | null,
  sessionWords: [] as string[],
  sessionScore: 0,
  spellStreak: 0,
  isComplete: false,
  sessionHistory: [] as SessionHistoryItem[],
});

export const useGameStore = create<GameState>((set, get) => ({
  ...emptySession(),

  startNewSession: () => set(emptySession()),

  setCurrentWord: (word) =>
    set((s) => ({
      currentWord: word,
      sessionWords: s.sessionWords.includes(word.id) ? s.sessionWords : [...s.sessionWords, word.id],
    })),

  recordAnswer: (isCorrect, userInput) => {
    const { currentWord } = get();
    if (!currentWord) return;
    set((s) => ({
      sessionScore: s.sessionScore + (isCorrect ? 1 : 0),
      spellStreak: isCorrect ? s.spellStreak + 1 : 0,
      sessionHistory: [...s.sessionHistory, { word: currentWord, isCorrect, userInput }],
    }));
  },

  endSession: () => set({ isComplete: true }),
}));
