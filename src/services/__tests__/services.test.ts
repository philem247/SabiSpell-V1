// Declare global variables for ts-node runner environment since React Native does not declare them
declare var require: any;
declare var process: any;

const assert = require('assert');

import { calculateSSRDelta } from '../ssr';
import { loadWordBank, getNextWord, getProverbForWord, updateWordHistory } from '../wordbank';

console.log('Running SabiSpell Service Tests...\n');

// ==========================================
// 1. SSR Engine Tests
// ==========================================
try {
  console.log('--- Testing SSR Engine ---');

  // Test Case A: player=1100, word=1220, correct -> expected delta ≈ +19
  const deltaA = calculateSSRDelta(1100, 1220, true);
  console.log(`Test Case A (Correct, Hard Word): player=1100, word=1220 -> delta = ${deltaA} (expected ≈ +19)`);
  assert.strictEqual(deltaA, 19, 'Correct hard word delta should be 19');

  // Test Case B: player=1100, word=980, wrong -> expected delta ≈ -8
  const deltaB = calculateSSRDelta(1100, 980, false);
  console.log(`Test Case B (Incorrect, Easy Word): player=1100, word=980 -> delta = ${deltaB} (expected ≈ -8)`);
  assert.strictEqual(deltaB, -8, 'Incorrect easy word delta should be -8');

  // Test Case C: Upper Bound (SSR_MAX = 2000)
  const maxDelta = calculateSSRDelta(1995, 2000, true);
  console.log(`Test Case C (Upper Bound): player=1995, word=2000, correct -> delta = ${maxDelta} (new rating: ${1995 + maxDelta})`);
  assert.ok(1995 + maxDelta <= 2000, 'Rating must not exceed 2000');

  // Test Case D: Lower Bound (SSR_MIN = 100)
  const minDelta = calculateSSRDelta(105, 100, false);
  console.log(`Test Case D (Lower Bound): player=105, word=100, wrong -> delta = ${minDelta} (new rating: ${105 + minDelta})`);
  assert.ok(105 + minDelta >= 100, 'Rating must not fall below 100');

  // Test Case E: Wazobia K-factor (K=32 vs K=24)
  const standardDelta = calculateSSRDelta(1100, 1200, true, false);
  const wazobiaDelta = calculateSSRDelta(1100, 1200, true, true);
  console.log(`Test Case E (Wazobia K-factor): standard correct delta = ${standardDelta}, wazobia correct delta = ${wazobiaDelta}`);
  assert.ok(wazobiaDelta > standardDelta, 'Wazobia K-factor (32) should yield larger delta than Standard (24)');

  console.log('✅ SSR Engine tests passed!\n');
} catch (error) {
  console.error('❌ SSR Engine tests failed:');
  console.error(error);
  process.exit(1);
}

// ==========================================
// 2. Word Bank Service Tests
// ==========================================
try {
  console.log('--- Testing Word Bank Service ---');

  const sssWords = loadWordBank('sss', 'en');
  const yorubaWords = loadWordBank('wazobia', 'yo');

  console.log(`Loaded English SSS bank: ${sssWords.length} words`);
  console.log(`Loaded Yoruba Wazobia bank: ${yorubaWords.length} words`);

  assert.ok(sssWords.length > 0, 'English word bank should not be empty');
  assert.ok(yorubaWords.length > 0, 'Yoruba word bank should not be empty');
  assert.strictEqual(sssWords[0].language, 'en', 'English words should have language = en');
  assert.strictEqual(yorubaWords[0].language, 'yo', 'Yoruba words should have language = yo');

  // Test getNextWord proximity and deduplication
  const playerSSR = 1100;
  const word1 = getNextWord(playerSSR, 'sss', 'en', [], []);
  if (!word1) throw new Error('word1 is null');
  
  console.log(`Selected word: "${word1.text}" (SSR: ${word1.ssr})`);
  assert.ok(Math.abs(word1.ssr - playerSSR) <= 300, 'Selected word should be within 300 SSR range');

  // Test session deduplication
  const sessionWords = [word1.id];
  const word2 = getNextWord(playerSSR, 'sss', 'en', sessionWords, []);
  if (!word2) throw new Error('word2 is null');
  
  console.log(`Selected second word: "${word2.text}" (SSR: ${word2.ssr})`);
  assert.notStrictEqual(word1.id, word2.id, 'Second word must not be the same as first word');

  // Test fallback logic (out-of-bounds player SSR)
  const wordExtreme = getNextWord(3000, 'sss', 'en', [], []);
  if (!wordExtreme) throw new Error('wordExtreme is null');
  
  console.log(`Selected fallback word: "${wordExtreme.text}" (SSR: ${wordExtreme.ssr})`);

  // Test history prioritization
  const allWordIds = sssWords.map((w) => w.id);
  const targetWord = sssWords[10];
  const history = allWordIds.filter((id) => id !== targetWord.id);
  
  const prioritizedWord = getNextWord(targetWord.ssr, 'sss', 'en', [], history);
  if (!prioritizedWord) throw new Error('prioritizedWord is null');
  
  console.log(`History test: all words in history except "${targetWord.text}". Selection got: "${prioritizedWord.text}"`);
  assert.strictEqual(prioritizedWord.id, targetWord.id, 'Should prioritize the only unseen word');

  // Test getProverbForWord
  const proverb = getProverbForWord('yw_012');
  if (!proverb) throw new Error('proverb is null');
  
  console.log(`Found Yoruba proverb: "${proverb.original}" -> "${proverb.translation}"`);
  assert.strictEqual(proverb.id, 'yp_001', 'Proverb ID should be yp_001');

  // Test updateWordHistory
  const initialHistory = ['sw_001'];
  const updatedHistory = updateWordHistory(initialHistory, 'sw_002');
  assert.deepStrictEqual(updatedHistory, ['sw_001', 'sw_002'], 'Should append new word ID');

  const duplicateHistory = updateWordHistory(updatedHistory, 'sw_001');
  assert.deepStrictEqual(duplicateHistory, ['sw_001', 'sw_002'], 'Should not duplicate word ID');

  console.log('✅ Word Bank Service tests passed!\n');
} catch (error) {
  console.error('❌ Word Bank Service tests failed:');
  console.error(error);
  process.exit(1);
}

console.log('🎉 All SabiSpell service tests passed successfully!');
