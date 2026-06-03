import { create } from 'zustand';

export interface ArenaState {
  botScore: number;
  botHistory: boolean[];
  botThinking: boolean;
  botProgress: number; // 0 to 1
  isMatchComplete: boolean;

  startArenaMatch: () => void;
  recordBotAnswer: (isCorrect: boolean) => void;
  setBotThinking: (thinking: boolean) => void;
  setBotProgress: (progress: number) => void;
  endMatch: () => void;
}

export const useArenaStore = create<ArenaState>((set) => ({
  botScore: 0,
  botHistory: [],
  botThinking: false,
  botProgress: 0,
  isMatchComplete: false,

  startArenaMatch: () => {
    set({
      botScore: 0,
      botHistory: [],
      botThinking: false,
      botProgress: 0,
      isMatchComplete: false,
    });
  },

  recordBotAnswer: (isCorrect) => {
    set((state) => ({
      botScore: isCorrect ? state.botScore + 1 : state.botScore,
      botHistory: [...state.botHistory, isCorrect],
    }));
  },

  setBotThinking: (thinking) => set({ botThinking: thinking }),
  setBotProgress: (progress) => set({ botProgress: progress }),
  endMatch: () => set({ isMatchComplete: true }),
}));
