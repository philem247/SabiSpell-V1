import { beforeEach, describe, expect, it } from 'vitest';
import type { CollectionId } from '../types';
import { useProfileStore } from './profileStore';

const MIN = 60 * 1000;

beforeEach(() => {
  localStorage.clear();
  useProfileStore.getState().reset(0);
});

describe('profileStore', () => {
  it('starts with per-collection SSR and a full energy bar', () => {
    const s = useProfileStore.getState();
    expect(s.ssr).toEqual({ classic: 1100, yoruba: 100 });
    expect(s.coins).toBe(0);
    expect(s.energy).toBe(5);
    expect(s.hasOnboarded).toBe(false);
  });

  it('completes onboarding with the placement SSR and starter coins', () => {
    useProfileStore.getState().completeOnboarding('  Ade  ', 1350, 0);
    const s = useProfileStore.getState();
    expect(s.username).toBe('Ade');
    expect(s.hasOnboarded).toBe(true);
    expect(s.coins).toBe(150);
    expect(s.ssr.classic).toBe(1350);
    expect(s.ssr.yoruba).toBe(100);
  });

  it('adds XP and coins', () => {
    useProfileStore.getState().addXPAndCoins(22, 11);
    expect(useProfileStore.getState().xp).toBe(22);
    expect(useProfileStore.getState().coins).toBe(11);
  });

  it('clamps SSR updates', () => {
    useProfileStore.getState().updateSSR('classic', 5000);
    expect(useProfileStore.getState().ssr.classic).toBe(2000);
    useProfileStore.getState().updateSSR('classic', -5000);
    expect(useProfileStore.getState().ssr.classic).toBe(100);
  });

  it('records each word once per collection', () => {
    useProfileStore.getState().addWordToHistory('classic', 'sw_001');
    useProfileStore.getState().addWordToHistory('classic', 'sw_001');
    useProfileStore.getState().addWordToHistory('yoruba', 'yw_001');
    const s = useProfileStore.getState();
    expect(s.word_history.classic).toEqual(['sw_001']);
    expect(s.word_history.yoruba).toEqual(['yw_001']);
  });

  it('deducts energy and refuses when short', () => {
    expect(useProfileStore.getState().deductEnergy(1, 0)).toBe(true);
    expect(useProfileStore.getState().energy).toBe(4);
    expect(useProfileStore.getState().deductEnergy(10, 0)).toBe(false);
    expect(useProfileStore.getState().energy).toBe(4);
  });

  it('refills energy over time', () => {
    useProfileStore.setState({ energy: 1, last_energy_refill_ts: 0 });
    useProfileStore.getState().refillEnergy(31 * MIN);
    expect(useProfileStore.getState().energy).toBe(3);
  });

  it('tracks the daily streak', () => {
    useProfileStore.getState().recordPlay('2026-11-11');
    useProfileStore.getState().recordPlay('2026-11-12');
    useProfileStore.getState().recordPlay('2026-11-12');
    expect(useProfileStore.getState().daily_streak).toBe(2);
    expect(useProfileStore.getState().last_played_date).toBe('2026-11-12');
  });

  it('records graduation per collection', () => {
    useProfileStore.getState().graduate('classic', '2026-11-12');
    expect(useProfileStore.getState().graduations).toEqual({ classic: '2026-11-12' });
  });

  it('does not grant starter coins twice', () => {
    useProfileStore.getState().completeOnboarding('Ade', 1300, 0);
    useProfileStore.getState().completeOnboarding('Bola', 1900, 0);
    const s = useProfileStore.getState();
    expect(s.username).toBe('Ade');
    expect(s.coins).toBe(150);
    expect(s.ssr.classic).toBe(1300);
  });

  it('ignores graduation for an unknown collection', () => {
    useProfileStore.getState().graduate('bogus' as unknown as CollectionId, '2026-11-12');
    expect(useProfileStore.getState().graduations).toEqual({});
  });

  it('ignores an empty username', () => {
    useProfileStore.getState().completeOnboarding('   ', 1300, 0);
    const s = useProfileStore.getState();
    expect(s.hasOnboarded).toBe(false);
    expect(s.coins).toBe(0);
    expect(s.ssr.classic).toBe(1100);
  });

  it('never lets XP or coins go below zero', () => {
    useProfileStore.getState().addXPAndCoins(-10, -10);
    expect(useProfileStore.getState().xp).toBe(0);
    expect(useProfileStore.getState().coins).toBe(0);
    useProfileStore.getState().addXPAndCoins(5, 5);
    useProfileStore.getState().addXPAndCoins(-50, -50);
    expect(useProfileStore.getState().xp).toBe(0);
    expect(useProfileStore.getState().coins).toBe(0);
  });

  it('ignores an unknown collection', () => {
    const before = useProfileStore.getState().ssr;
    useProfileStore.getState().updateSSR('bogus' as unknown as CollectionId, 50);
    useProfileStore.getState().addWordToHistory('bogus' as unknown as CollectionId, 'x');
    const s = useProfileStore.getState();
    expect(s.ssr).toEqual(before);
    expect(Object.keys(s.word_history)).toEqual(['classic', 'yoruba']);
    expect(s.word_history.classic).toEqual([]);
    expect(s.word_history.yoruba).toEqual([]);
  });

  it('persists the refilled energy even when a deduction fails', () => {
    useProfileStore.setState({ energy: 1, last_energy_refill_ts: 0 });
    const ok = useProfileStore.getState().deductEnergy(5, 31 * MIN);
    expect(ok).toBe(false);
    expect(useProfileStore.getState().energy).toBe(3);
    expect(useProfileStore.getState().last_energy_refill_ts).toBe(2 * 15 * MIN);
  });

  it('fills in a collection missing from stored state on rehydrate', async () => {
    localStorage.setItem(
      'sabispell:profile',
      JSON.stringify({
        state: { xp: 99, ssr: { classic: 1500 }, word_history: { classic: ['sw_001'] } },
        version: 1,
      }),
    );
    await useProfileStore.persist.rehydrate();
    const s = useProfileStore.getState();
    expect(s.xp).toBe(99);
    expect(s.ssr).toEqual({ classic: 1500, yoruba: 100 });
    expect(s.word_history).toEqual({ classic: ['sw_001'], yoruba: [] });
    expect(s.graduations).toEqual({});
  });

  it('ignores null values in stored state', async () => {
    localStorage.setItem(
      'sabispell:profile',
      JSON.stringify({ state: { xp: null, coins: 7 }, version: 1 }),
    );
    await useProfileStore.persist.rehydrate();
    const s = useProfileStore.getState();
    expect(s.xp).toBe(0);
    expect(s.coins).toBe(7);
  });

  it('drops wrong-typed nested entries on rehydrate', async () => {
    localStorage.setItem(
      'sabispell:profile',
      JSON.stringify({
        state: {
          ssr: { classic: 'x', yoruba: 250 },
          word_history: { classic: null, yoruba: ['yw_001'] },
          graduations: { classic: 5 },
        },
        version: 1,
      }),
    );
    await useProfileStore.persist.rehydrate();
    const s = useProfileStore.getState();
    expect(s.ssr).toEqual({ classic: 1100, yoruba: 250 });
    expect(s.word_history).toEqual({ classic: [], yoruba: ['yw_001'] });
    expect(s.graduations).toEqual({});
  });

  it('keeps default ssr when stored ssr is null', async () => {
    localStorage.setItem('sabispell:profile', JSON.stringify({ state: { ssr: null }, version: 1 }));
    await useProfileStore.persist.rehydrate();
    expect(useProfileStore.getState().ssr).toEqual({ classic: 1100, yoruba: 100 });
  });

  it('persists to localStorage under the profile key', () => {
    useProfileStore.getState().addXPAndCoins(40, 0);
    const saved = JSON.parse(localStorage.getItem('sabispell:profile')!);
    expect(saved.state.xp).toBe(40);
  });
});
