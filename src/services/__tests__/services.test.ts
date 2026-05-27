// Set NODE_ENV to test before any imports so profileStore uses the memory storage mock
if (typeof process !== 'undefined') {
  if (!process.env) process.env = {};
  process.env.NODE_ENV = 'test';
}

declare var require: any;
declare var process: any;

const assert = require('assert');

import { calculateSSRDelta } from '../ssr';
import { loadWordBank, getNextWord, getProverbForWord, updateWordHistory } from '../wordbank';
import { calculateReward } from '../economy';
import { getEnergyCap, calculateEnergyRefill, deductEnergy } from '../energy';
import { useProfileStore } from '../../store/profileStore';
import { useGameStore } from '../../store/gameStore';

console.log('Running SabiSpell Days 3-7 Service and Store Tests...\n');

// ==========================================
// 1. SSR Engine Tests
// ==========================================
try {
  console.log('--- Testing SSR Engine ---');

  const deltaA = calculateSSRDelta(1100, 1220, true);
  console.log(`Test Case A (Correct): player=1100, word=1220 -> delta = ${deltaA} (expected ≈ +19)`);
  assert.strictEqual(deltaA, 19);

  const deltaB = calculateSSRDelta(1100, 980, false);
  console.log(`Test Case B (Incorrect): player=1100, word=980 -> delta = ${deltaB} (expected ≈ -8)`);
  assert.strictEqual(deltaB, -8);

  const maxDelta = calculateSSRDelta(1995, 2000, true);
  assert.ok(1995 + maxDelta <= 2000);

  const minDelta = calculateSSRDelta(105, 100, false);
  assert.ok(105 + minDelta >= 100);

  console.log('✅ SSR Engine tests passed!\n');
} catch (error) {
  console.error('❌ SSR Engine tests failed:', error);
  process.exit(1);
}

// ==========================================
// 2. Word Bank Service Tests
// ==========================================
try {
  console.log('--- Testing Word Bank Service ---');

  const sssWords = loadWordBank('sss', 'en');
  const yorubaWords = loadWordBank('wazobia', 'yo');

  assert.ok(sssWords.length > 0);
  assert.ok(yorubaWords.length > 0);

  const playerSSR = 1100;
  const word1 = getNextWord(playerSSR, 'sss', 'en', [], []);
  if (!word1) throw new Error('word1 is null');
  assert.ok(Math.abs(word1.ssr - playerSSR) <= 300);

  const sessionWords = [word1.id];
  const word2 = getNextWord(playerSSR, 'sss', 'en', sessionWords, []);
  if (!word2) throw new Error('word2 is null');
  assert.notStrictEqual(word1.id, word2.id);

  const proverb = getProverbForWord('yw_012');
  if (!proverb) throw new Error('proverb is null');
  assert.strictEqual(proverb.id, 'yp_001');

  console.log('✅ Word Bank Service tests passed!\n');
} catch (error) {
  console.error('❌ Word Bank Service tests failed:', error);
  process.exit(1);
}

// ==========================================
// 3. Economy Service Tests
// ==========================================
try {
  console.log('--- Testing Economy Service ---');

  const rewardA = calculateReward(1100, true, 0, false);
  assert.strictEqual(rewardA.xp, 20);
  assert.strictEqual(rewardA.coins, 10);

  const rewardB = calculateReward(1100, false, 5, true);
  assert.strictEqual(rewardB.xp, 0);
  assert.strictEqual(rewardB.coins, 0);

  const rewardC = calculateReward(1100, true, 3, false);
  assert.strictEqual(rewardC.xp, 22);
  assert.strictEqual(rewardC.coins, 11);

  const rewardD = calculateReward(1100, true, 10, true);
  assert.strictEqual(rewardD.xp, 45);
  assert.strictEqual(rewardD.coins, 23);

  console.log('✅ Economy Service tests passed!\n');
} catch (error) {
  console.error('❌ Economy Service tests failed:', error);
  process.exit(1);
}

// ==========================================
// 4. Energy Service Tests
// ==========================================
try {
  console.log('--- Testing Energy Service ---');

  // getEnergyCap
  const cap = getEnergyCap();
  assert.strictEqual(cap, 5, 'Energy capacity cap should be 5');

  const now = Date.now();
  const fifteenMinsMs = 15 * 60 * 1000;

  // calculateEnergyRefill - Already at cap, should do nothing
  const refill1 = calculateEnergyRefill(5, now, now + fifteenMinsMs);
  assert.strictEqual(refill1.energy, 5, 'Should remain at cap');

  // calculateEnergyRefill - No time passed
  const refill2 = calculateEnergyRefill(2, now, now);
  assert.strictEqual(refill2.energy, 2, 'Should not refill without time elapsed');
  assert.strictEqual(refill2.lastRefillTs, now);

  // calculateEnergyRefill - exactly 1 pip refilled (15 mins elapsed)
  const refill3 = calculateEnergyRefill(2, now, now + fifteenMinsMs);
  assert.strictEqual(refill3.energy, 3, 'Should refill exactly 1 pip in 15 mins');
  assert.strictEqual(refill3.lastRefillTs, now + fifteenMinsMs);

  // calculateEnergyRefill - 31 minutes elapsed (2 pips refilled + 1 min remainder)
  const refill4 = calculateEnergyRefill(2, now, now + 31 * 60 * 1000);
  assert.strictEqual(refill4.energy, 4, 'Should refill exactly 2 pips in 31 mins');
  assert.strictEqual(refill4.lastRefillTs, now + 30 * 60 * 1000, 'Should retain the 1 min fractional progress');

  // calculateEnergyRefill - 90 minutes elapsed (should cap at 5 pips)
  const refill5 = calculateEnergyRefill(2, now, now + 90 * 60 * 1000);
  assert.strictEqual(refill5.energy, 5, 'Should cap at max 5 energy');
  assert.strictEqual(refill5.lastRefillTs, now + 90 * 60 * 1000, 'Refill timestamp should reset to now upon capping');

  // deductEnergy - Deduct 1 pip from cap
  const deduct1 = deductEnergy(5, 1, now, now);
  assert.strictEqual(deduct1.success, true);
  assert.strictEqual(deduct1.energy, 4);
  assert.strictEqual(deduct1.lastRefillTs, now, 'Deduction from cap should start the refill timer now');

  // deductEnergy - Refill 1 pip then deduct 1
  const deduct2 = deductEnergy(2, 1, now, now + fifteenMinsMs);
  // refilled: 2 + 1 = 3 pips
  // deducted: 3 - 1 = 2 pips
  assert.strictEqual(deduct2.success, true);
  assert.strictEqual(deduct2.energy, 2);
  assert.strictEqual(deduct2.lastRefillTs, now + fifteenMinsMs);

  // deductEnergy - Insufficient energy
  const deduct3 = deductEnergy(1, 2, now, now);
  assert.strictEqual(deduct3.success, false);
  assert.strictEqual(deduct3.energy, 1);
  assert.strictEqual(deduct3.lastRefillTs, now);

  console.log('✅ Energy Service tests passed!\n');
} catch (error) {
  console.error('❌ Energy Service tests failed:', error);
  process.exit(1);
}

// ==========================================
// 5. Zustand Profile Store Tests
// ==========================================
try {
  console.log('--- Testing Zustand Profile Store ---');

  // Verify initial state loads DEMO_PROFILE by default
  const store = useProfileStore.getState();
  assert.strictEqual(store.username, 'SpellChampion');
  assert.strictEqual(store.xp, 6420);
  assert.strictEqual(store.coins, 340);
  assert.strictEqual(store.current_title, 'Scholar');

  // Test addXPAndCoins
  useProfileStore.getState().addXPAndCoins(100, 50);
  let updatedStore = useProfileStore.getState();
  assert.strictEqual(updatedStore.xp, 6520);
  assert.strictEqual(updatedStore.coins, 390);

  // Test title progression (Add 14,000 XP to pass 20,000 threshold for "Word Sage")
  useProfileStore.getState().addXPAndCoins(14000, 0);
  updatedStore = useProfileStore.getState();
  assert.strictEqual(updatedStore.current_title, 'Word Sage');

  // Test deductEnergy (Zustand delegation verification)
  useProfileStore.setState({ energy: 5, last_energy_refill_ts: Date.now() });
  const deductResult = useProfileStore.getState().deductEnergy(1);
  updatedStore = useProfileStore.getState();
  assert.strictEqual(deductResult, true);
  assert.strictEqual(updatedStore.energy, 4);

  // Test resetProfile
  useProfileStore.getState().resetProfile();
  updatedStore = useProfileStore.getState();
  assert.strictEqual(updatedStore.xp, 6420); // should reload DEMO_PROFILE

  console.log('✅ Profile Store tests passed!\n');
} catch (error) {
  console.error('❌ Profile Store tests failed:', error);
  process.exit(1);
}

// ==========================================
// 6. Zustand Game Store Tests
// ==========================================
try {
  console.log('--- Testing Zustand Game Store ---');

  useGameStore.getState().startNewSession();
  let gameState = useGameStore.getState();
  assert.strictEqual(gameState.sessionScore, 0);
  assert.strictEqual(gameState.spellStreak, 0);

  const dummyWord = { id: 'dummy_01', text: 'test', ssr: 1000, tier: 'sss', language: 'en', definition: '', context_sentences: [], phonetic: '' };
  useGameStore.getState().setCurrentWord(dummyWord);
  gameState = useGameStore.getState();
  assert.strictEqual(gameState.currentWord?.id, 'dummy_01');
  assert.deepStrictEqual(gameState.sessionWords, ['dummy_01']);

  useGameStore.getState().recordAnswer(true);
  gameState = useGameStore.getState();
  assert.strictEqual(gameState.sessionScore, 1);
  assert.strictEqual(gameState.spellStreak, 1);

  useGameStore.getState().endSession();
  gameState = useGameStore.getState();
  assert.strictEqual(gameState.isComplete, true);

  console.log('✅ Game Store tests passed!\n');
} catch (error) {
  console.error('❌ Game Store tests failed:', error);
  process.exit(1);
}

console.log('🎉 All SabiSpell service and store tests passed successfully!');
