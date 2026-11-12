export type CollectionId = 'classic' | 'yoruba';

export interface Word {
  id: string;
  text: string;
  ssr: number;
  collection: CollectionId;
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
