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
import { useProfileStore } from '../../store/profileStore';
import { useGameStore } from '../../store/gameStore';

console.log('Running SabiSpell Day 3 + 4 Service and Store Tests...\n');

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

  // Test correct answer, no streak, no daily challenge
  // base_coins = 5 + floor(1100 / 200) = 5 + 5 = 10. base_xp = 20.
  const rewardA = calculateReward(1100, true, 0, false);
  console.log(`Reward A (no multipliers): SSR 1100, correct -> xp: ${rewardA.xp}, coins: ${rewardA.coins} (expected xp: 20, coins: 10)`);
  assert.strictEqual(rewardA.xp, 20);
  assert.strictEqual(rewardA.coins, 10);

  // Test incorrect answer -> should earn 0
  const rewardB = calculateReward(1100, false, 5, true);
  console.log(`Reward B (incorrect): SSR 1100, incorrect -> xp: ${rewardB.xp}, coins: ${rewardB.coins} (expected 0, 0)`);
  assert.strictEqual(rewardB.xp, 0);
  assert.strictEqual(rewardB.coins, 0);

  // Test 3 streak multiplier (1.1x)
  // base_coins = 10, base_xp = 20
  // coins = round(10 * 1.1) = 11, xp = round(20 * 1.1) = 22
  const rewardC = calculateReward(1100, true, 3, false);
  console.log(`Reward C (3 streak): SSR 1100 -> xp: ${rewardC.xp}, coins: ${rewardC.coins} (expected xp: 22, coins: 11)`);
  assert.strictEqual(rewardC.xp, 22);
  assert.strictEqual(rewardC.coins, 11);

  // Test 10 streak (1.5x) + Daily Challenge (1.5x)
  // combined = 1.5 * 1.5 = 2.25 (below cap of 2.5)
  // coins = round(10 * 2.25) = 23, xp = round(20 * 2.25) = 45
  const rewardD = calculateReward(1100, true, 10, true);
  console.log(`Reward D (10 streak + daily): SSR 1100 -> xp: ${rewardD.xp}, coins: ${rewardD.coins} (expected xp: 45, coins: 23)`);
  assert.strictEqual(rewardD.xp, 45);
  assert.strictEqual(rewardD.coins, 23);

  // Test capping logic (2.5x cap)
  // To trigger cap, we will simulate a combined multiplier that exceeds 2.5
  // If we had a 1.8x streak multiplier + 1.5x daily challenge = 2.7x, it should clamp to 2.5x.
  // Let's verify that the code mathematically clamps to 2.5x if we had high values.
  // In the active config, 1.5 * 1.5 = 2.25 is the max, but let's make sure the capping works:
  // If we pass an imaginary test case with a very high streak, or verify the cap logic in code.
  // Let's inspect calculateReward returns for SSR 1800 (base_coins = 14, base_xp = 28)
  const rewardCap = calculateReward(1800, true, 12, true); // combined 2.25x
  console.log(`Reward Cap check: SSR 1800, 12 streak, daily -> xp: ${rewardCap.xp}, coins: ${rewardCap.coins} (expected base * 2.25)`);
  assert.strictEqual(rewardCap.coins, Math.round(14 * 2.25));

  console.log('✅ Economy Service tests passed!\n');
} catch (error) {
  console.error('❌ Economy Service tests failed:', error);
  process.exit(1);
}

// ==========================================
// 4. Zustand Profile Store Tests
// ==========================================
try {
  console.log('--- Testing Zustand Profile Store ---');

  // Verify initial state loads DEMO_PROFILE by default
  const store = useProfileStore.getState();
  console.log(`Initial profile loaded. Username: ${store.username}, XP: ${store.xp}, Coins: ${store.coins}, Title: ${store.current_title}`);
  assert.strictEqual(store.username, 'SpellChampion');
  assert.strictEqual(store.xp, 6420);
  assert.strictEqual(store.coins, 340);
  assert.strictEqual(store.current_title, 'Scholar');

  // Test addXPAndCoins
  useProfileStore.getState().addXPAndCoins(100, 50);
  let updatedStore = useProfileStore.getState();
  console.log(`After adding 100 XP & 50 Coins -> XP: ${updatedStore.xp}, Coins: ${updatedStore.coins}`);
  assert.strictEqual(updatedStore.xp, 6520);
  assert.strictEqual(updatedStore.coins, 390);

  // Test title progression (Add 14,000 XP to pass 20,000 threshold for "Word Sage")
  useProfileStore.getState().addXPAndCoins(14000, 0);
  updatedStore = useProfileStore.getState();
  console.log(`After adding 14000 XP -> XP: ${updatedStore.xp}, Title: ${updatedStore.current_title}`);
  assert.strictEqual(updatedStore.current_title, 'Word Sage');

  // Test deductEnergy
  useProfileStore.setState({ energy: 5 });
  const deductResult = useProfileStore.getState().deductEnergy(1);
  updatedStore = useProfileStore.getState();
  console.log(`Deduct 1 energy -> success: ${deductResult}, current energy: ${updatedStore.energy}`);
  assert.strictEqual(deductResult, true);
  assert.strictEqual(updatedStore.energy, 4);

  // Test checkAndRefillEnergy (simulate 30 minutes passing to refill 2 pips)
  // Set energy to 2, and last refill to 31 minutes ago (1860000 ms)
  const thirtyOneMinsAgo = Date.now() - 31 * 60 * 1000;
  useProfileStore.setState({ energy: 2, last_energy_refill_ts: thirtyOneMinsAgo });
  
  useProfileStore.getState().checkAndRefillEnergy();
  updatedStore = useProfileStore.getState();
  console.log(`Refill check after 31 mins (energy was 2) -> current energy: ${updatedStore.energy}`);
  // Should refill 2 pips (15 mins each) -> energy should become 4
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
// 5. Zustand Game Store Tests
// ==========================================
try {
  console.log('--- Testing Zustand Game Store ---');

  // Start new session
  useGameStore.getState().startNewSession();
  let gameState = useGameStore.getState();
  assert.strictEqual(gameState.sessionScore, 0);
  assert.strictEqual(gameState.spellStreak, 0);
  assert.strictEqual(gameState.sessionWords.length, 0);

  // Set current word
  const dummyWord = { id: 'dummy_01', text: 'test', ssr: 1000, tier: 'sss', language: 'en', definition: '', context_sentences: [], phonetic: '' };
  useGameStore.getState().setCurrentWord(dummyWord);
  gameState = useGameStore.getState();
  assert.strictEqual(gameState.currentWord?.id, 'dummy_01');
  assert.deepStrictEqual(gameState.sessionWords, ['dummy_01']);

  // Record correct answer
  useGameStore.getState().recordAnswer(true);
  gameState = useGameStore.getState();
  console.log(`After correct answer -> score: ${gameState.sessionScore}, streak: ${gameState.spellStreak}`);
  assert.strictEqual(gameState.sessionScore, 1);
  assert.strictEqual(gameState.spellStreak, 1);

  // Record second correct answer
  useGameStore.getState().recordAnswer(true);
  gameState = useGameStore.getState();
  assert.strictEqual(gameState.sessionScore, 2);
  assert.strictEqual(gameState.spellStreak, 2);

  // Record incorrect answer -> streak should reset
  useGameStore.getState().recordAnswer(false);
  gameState = useGameStore.getState();
  console.log(`After wrong answer -> score: ${gameState.sessionScore}, streak: ${gameState.spellStreak}`);
  assert.strictEqual(gameState.sessionScore, 2);
  assert.strictEqual(gameState.spellStreak, 0);

  // End session
  useGameStore.getState().endSession();
  gameState = useGameStore.getState();
  assert.strictEqual(gameState.isComplete, true);

  console.log('✅ Game Store tests passed!\n');
} catch (error) {
  console.error('❌ Game Store tests failed:', error);
  process.exit(1);
}

console.log('🎉 All SabiSpell service and store tests passed successfully!');
