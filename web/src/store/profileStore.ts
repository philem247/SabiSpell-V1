import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Config } from '../config';
import { COLLECTIONS, COLLECTION_IDS } from '../data/collections';
import { calculateEnergyRefill, deductEnergy as deductEnergyPips } from '../services/energy';
import { clampSSR } from '../services/ssr';
import { nextStreak, todayISO } from '../services/streak';
import { updateWordHistory } from '../services/wordbank';
import type { CollectionId } from '../types';

export interface Profile {
  username: string;
  hasOnboarded: boolean;
  ssr: Record<CollectionId, number>;
  xp: number;
  coins: number;
  daily_streak: number;
  last_played_date: string;
  word_history: Record<CollectionId, string[]>;
  energy: number;
  last_energy_refill_ts: number;
  graduations: Partial<Record<CollectionId, string>>;
}

function perCollection<T>(make: (id: CollectionId) => T): Record<CollectionId, T> {
  return Object.fromEntries(COLLECTION_IDS.map((id) => [id, make(id)])) as Record<CollectionId, T>;
}

export function createInitialProfile(now: number = Date.now()): Profile {
  return {
    username: '',
    hasOnboarded: false,
    ssr: perCollection((id) => COLLECTIONS[id].startSSR),
    xp: 0,
    coins: 0,
    daily_streak: 0,
    last_played_date: '',
    word_history: perCollection(() => []),
    energy: Config.ENERGY_CAP,
    last_energy_refill_ts: now,
    graduations: {},
  };
}

interface ProfileActions {
  completeOnboarding(username: string, placementSSR: number, now?: number): void;
  addXPAndCoins(xp: number, coins: number): void;
  updateSSR(collection: CollectionId, delta: number): void;
  addWordToHistory(collection: CollectionId, wordId: string): void;
  deductEnergy(amount: number, now?: number): boolean;
  refillEnergy(now?: number): void;
  recordPlay(today?: string): void;
  graduate(collection: CollectionId, date?: string): void;
  reset(now?: number): void;
}

export const useProfileStore = create<Profile & ProfileActions>()(
  persist(
    (set, get) => ({
      ...createInitialProfile(),

      completeOnboarding: (username, placementSSR, now = Date.now()) =>
        set((s) => {
          const name = username.trim();
          if (!name) return {};
          return {
            username: name,
            hasOnboarded: true,
            coins: s.coins + Config.STARTER_COINS,
            ssr: { ...s.ssr, classic: clampSSR(placementSSR) },
            energy: Config.ENERGY_CAP,
            last_energy_refill_ts: now,
          };
        }),

      addXPAndCoins: (xp, coins) =>
        set((s) => ({ xp: Math.max(0, s.xp + xp), coins: Math.max(0, s.coins + coins) })),

      updateSSR: (collection, delta) =>
        set((s) => {
          if (!Object.hasOwn(COLLECTIONS, collection)) return {};
          return { ssr: { ...s.ssr, [collection]: clampSSR(s.ssr[collection] + delta) } };
        }),

      addWordToHistory: (collection, wordId) =>
        set((s) => {
          if (!Object.hasOwn(COLLECTIONS, collection)) return {};
          return {
            word_history: {
              ...s.word_history,
              [collection]: updateWordHistory(s.word_history[collection], wordId),
            },
          };
        }),

      deductEnergy: (amount, now = Date.now()) => {
        const { energy, last_energy_refill_ts } = get();
        const r = deductEnergyPips(energy, amount, last_energy_refill_ts, now);
        set({ energy: r.energy, last_energy_refill_ts: r.lastRefillTs });
        return r.success;
      },

      refillEnergy: (now = Date.now()) =>
        set((s) => {
          const r = calculateEnergyRefill(s.energy, s.last_energy_refill_ts, now);
          return { energy: r.energy, last_energy_refill_ts: r.lastRefillTs };
        }),

      recordPlay: (today = todayISO()) =>
        set((s) => ({
          daily_streak: nextStreak(s.daily_streak, s.last_played_date, today),
          last_played_date: today,
        })),

      graduate: (collection, date = todayISO()) =>
        set((s) => ({ graduations: { ...s.graduations, [collection]: date } })),

      reset: (now = Date.now()) => set(createInitialProfile(now)),
    }),
    {
      name: Config.STORAGE_KEYS.PROFILE,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Deep-merge per-collection maps so a stored profile lacking a newer collection still gets its defaults. Null top-level values are ignored so corrupt data cannot override defaults.
      merge: (persisted, current) => {
        const saved = Object.fromEntries(
          Object.entries((persisted ?? {}) as Record<string, unknown>).filter(([, value]) => value != null),
        ) as Partial<Profile>;
        return {
          ...current,
          ...saved,
          ssr: { ...current.ssr, ...saved.ssr },
          word_history: { ...current.word_history, ...saved.word_history },
          graduations: { ...current.graduations, ...saved.graduations },
        };
      },
    },
  ),
);
