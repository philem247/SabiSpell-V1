import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppConfig, getXPTitle } from '../constants/AppConfig';
import { PlayerProfile, DEMO_PROFILE } from '../constants/DemoSeeds';
import { calculateEnergyRefill, deductEnergy as serviceDeductEnergy } from '../services/energy';

// Simple in-memory storage fallback for Node.js unit testing environments
const memoryStorage: Record<string, string> = {};
const mockMemoryStorage = {
  getItem: (name: string): string | null => {
    return memoryStorage[name] || null;
  },
  setItem: (name: string, value: string): void => {
    memoryStorage[name] = value;
  },
  removeItem: (name: string): void => {
    delete memoryStorage[name];
  },
};

// Detect if we are running in a Node.js testing environment vs React Native runtime
const isNode = typeof process !== 'undefined' && process.versions && !!process.versions.node;
const activeStorage = isNode ? mockMemoryStorage : AsyncStorage;

const DEFAULT_PROFILE: PlayerProfile = {
  username: '',
  declaredClass: 'SSS 2',
  declaredTier: 'sss',
  hasOnboarded: false,
  academic_ssr: AppConfig.SSR_SSS_DEFAULT,
  wazobia_ssr: 100,
  xp: 0,
  coins: 0,
  current_title: 'Recruit',
  daily_streak: 0,
  last_played_date: '',
  word_history: {
    sss: [],
    yoruba: [],
  },
  wazobia_words_completed: { yo: 0 },
  energy: AppConfig.ENERGY_CAP,
  last_energy_refill_ts: Date.now(),
  isGraduated: false,
  graduation_date: null,
};

export interface ProfileStore extends PlayerProfile {
  checkAndRefillEnergy: () => void;
  setOnboarded: (username: string, declaredClass: string) => void;
  updateProfile: (updates: Partial<PlayerProfile>) => void;
  addXPAndCoins: (xpAdded: number, coinsAdded: number) => void;
  updateSSR: (academicDelta: number, wazobiaDelta: number) => void;
  addWordToHistory: (tier: 'sss' | 'yoruba', wordId: string) => void;
  deductEnergy: (amount: number) => boolean;
  refillEnergy: () => void;
  updateDailyStreak: () => void;
  resetProfile: () => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      // State values initialized to Demo or Default depending on mode config
      ...(AppConfig.__DEMO_MODE__ ? DEMO_PROFILE : DEFAULT_PROFILE),

      checkAndRefillEnergy: () => {
        const state = get();
        const result = calculateEnergyRefill(state.energy, state.last_energy_refill_ts, Date.now());
        set({
          energy: result.energy,
          last_energy_refill_ts: result.lastRefillTs,
        });
      },

      setOnboarded: (username, declaredClass) => {
        set({
          username,
          declaredClass,
          hasOnboarded: true,
          coins: AppConfig.STARTER_COINS, // 150 starter coins
          energy: AppConfig.ENERGY_CAP,   // Reset energy to cap
          last_energy_refill_ts: Date.now(),
        });
      },

      updateProfile: (updates) => {
        set(updates);
      },

      addXPAndCoins: (xpAdded, coinsAdded) => {
        const currentXP = get().xp;
        const newXP = currentXP + xpAdded;
        const newCoins = get().coins + coinsAdded;
        const newTitle = getXPTitle(newXP);

        set({
          xp: newXP,
          coins: newCoins,
          current_title: newTitle,
        });
      },

      updateSSR: (academicDelta, wazobiaDelta) => {
        const newAcademic = Math.max(
          AppConfig.SSR_MIN,
          Math.min(AppConfig.SSR_MAX, get().academic_ssr + academicDelta)
        );
        const newWazobia = Math.max(
          AppConfig.SSR_MIN,
          Math.min(AppConfig.SSR_MAX, get().wazobia_ssr + wazobiaDelta)
        );
        set({
          academic_ssr: newAcademic,
          wazobia_ssr: newWazobia,
        });
      },

      addWordToHistory: (tier, wordId) => {
        const history = get().word_history;
        const tierHistory = history[tier] || [];
        if (tierHistory.includes(wordId)) {
          return;
        }
        set({
          word_history: {
            ...history,
            [tier]: [...tierHistory, wordId],
          },
          ...(tier === 'yoruba'
            ? {
                wazobia_words_completed: {
                  yo: get().wazobia_words_completed.yo + 1,
                },
              }
            : {}),
        });
      },

      deductEnergy: (amount) => {
        const state = get();
        const result = serviceDeductEnergy(state.energy, amount, state.last_energy_refill_ts, Date.now());
        if (!result.success) {
          return false;
        }
        set({
          energy: result.energy,
          last_energy_refill_ts: result.lastRefillTs,
        });
        return true;
      },

      refillEnergy: () => {
        set({
          energy: AppConfig.ENERGY_CAP,
          last_energy_refill_ts: Date.now(),
        });
      },

      updateDailyStreak: () => {
        const today = new Date().toDateString();
        const lastPlayed = get().last_played_date;

        if (lastPlayed === today) {
          return;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        let newStreak = get().daily_streak;

        if (lastPlayed === yesterdayStr) {
          newStreak += 1;
        } else if (lastPlayed === '') {
          newStreak = 1;
        } else {
          newStreak = 1;
        }

        set({
          daily_streak: newStreak,
          last_played_date: today,
        });
      },

      resetProfile: () => {
        set(AppConfig.__DEMO_MODE__ ? DEMO_PROFILE : DEFAULT_PROFILE);
      },
    }),
    {
      name: AppConfig.STORAGE_KEYS.PROFILE,
      storage: createJSONStorage(() => activeStorage as any),
    }
  )
);
