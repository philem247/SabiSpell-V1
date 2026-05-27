import { AppConfig } from '../constants/AppConfig';
import sssWordbank from '../../assets/wordbanks/sss_wordbank.json';
import yorubaWordbank from '../../assets/wordbanks/yoruba_wordbank.json';

export interface Word {
  id: string;
  text: string;
  ssr: number;
  tier: string;
  language: string;
  definition: string;
  context_sentences: string[];
  phonetic: string;
  etymology?: string;
  language_of_origin?: string;
  tone_guide?: string;
  proverb_id?: string;
}

export interface Proverb {
  id: string;
  language: string;
  original: string;
  translation: string;
  word_id: string;
  tone_guide?: string;
}

/**
 * Loads the word list for a specific tier and language.
 */
export function loadWordBank(tier: string, language: string): Word[] {
  if (language === 'yo' || tier === 'wazobia') {
    return yorubaWordbank.words as Word[];
  }
  // Default to SSS English word bank
  return sssWordbank as Word[];
}

/**
 * Selects the next word using adaptive ELO proximity matching.
 *
 * Rules:
 * 1. Exclude words already played in the current session (sessionWords).
 * 2. Filter words within AppConfig.SSR_WORD_PROXIMITY (±300) of the player's rating.
 * 3. Prioritize unseen words (not in long-term wordHistory).
 * 4. Fallback sequence if no words match the proximity criteria:
 *    - Expand range to ±500
 *    - Fall back to any unused word in the database (safeguard against app crash)
 */
export function getNextWord(
  playerSSR: number,
  tier: string,
  language: string,
  sessionWords: string[],
  wordHistory: string[]
): Word | null {
  const allWords = loadWordBank(tier, language);

  // 1. Exclude words already played in the current session
  const remainingWords = allWords.filter((w) => !sessionWords.includes(w.id));

  // If there are no words left in the database that haven't been played in this session
  if (remainingWords.length === 0) {
    return null;
  }

  // Helper to filter and pick from a candidates list prioritizing unseen
  const pickCandidate = (candidatesList: Word[]): Word | null => {
    if (candidatesList.length === 0) return null;

    // Prioritize words that are NOT in the player's long-term history
    const unseen = candidatesList.filter((w) => !wordHistory.includes(w.id));
    const finalPool = unseen.length > 0 ? unseen : candidatesList;

    // Pick one at random from the pool
    const randomIndex = Math.floor(Math.random() * finalPool.length);
    return finalPool[randomIndex];
  };

  // Try standard proximity range (±300)
  let proximityCandidates = remainingWords.filter(
    (w) => Math.abs(w.ssr - playerSSR) <= AppConfig.SSR_WORD_PROXIMITY
  );
  let chosenWord = pickCandidate(proximityCandidates);

  // Fallback 1: Expand range to ±500 if no close matches found
  if (!chosenWord) {
    proximityCandidates = remainingWords.filter(
      (w) => Math.abs(w.ssr - playerSSR) <= 500
    );
    chosenWord = pickCandidate(proximityCandidates);
  }

  // Fallback 2: Pick from any remaining unused words in the session
  if (!chosenWord) {
    chosenWord = pickCandidate(remainingWords);
  }

  return chosenWord;
}

/**
 * Returns the Yoruba proverb associated with a word, if one exists.
 */
export function getProverbForWord(wordId: string): Proverb | null {
  const proverb = yorubaWordbank.proverbs.find((p) => p.word_id === wordId);
  return proverb || null;
}

/**
 * Updates the user's word history list by appending the new word ID if not already present.
 */
export function updateWordHistory(currentHistory: string[], wordId: string): string[] {
  if (currentHistory.includes(wordId)) {
    return currentHistory;
  }
  return [...currentHistory, wordId];
}
