import classicRaw from './words/classic.json';
import yorubaRaw from './words/yoruba.json';
import type { CollectionId, Proverb, Word } from '../types';

type RawWord = Omit<Word, 'collection'> & { tier?: string };

function toWords(raw: RawWord[], collection: CollectionId): Word[] {
  return raw.map(({ tier: _legacyTier, ...word }) => ({ ...word, collection }));
}

export interface Collection {
  id: CollectionId;
  name: string;
  description: string;
  free: boolean;
  startSSR: number;
  kFactor: number;
  energyCost: number;
  words: Word[];
}

const yoruba = yorubaRaw as unknown as { words: RawWord[]; proverbs: Proverb[] };

export const COLLECTIONS: Record<CollectionId, Collection> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'English vocabulary from everyday to advanced, levelled by your skill.',
    free: true,
    startSSR: 1100,
    kFactor: 24,
    energyCost: 1,
    words: toWords(classicRaw as unknown as RawWord[], 'classic'),
  },
  yoruba: {
    id: 'yoruba',
    name: 'Yoruba',
    description: 'Spell Yoruba words with tone marks and learn the proverbs behind them.',
    free: true,
    startSSR: 100,
    kFactor: 32,
    energyCost: 2,
    words: toWords(yoruba.words, 'yoruba'),
  },
};

export const COLLECTION_IDS = Object.keys(COLLECTIONS) as CollectionId[];
export const PROVERBS: Proverb[] = yoruba.proverbs;
