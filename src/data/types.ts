export interface WordDefinition {
  en: string;
  zh: string;
}

export interface WordExample {
  en: string;
  zh: string;
}

export interface EtymologyPart {
  part: string;
  type: 'prefix' | 'root' | 'suffix';
  meaning: string;
}

export interface Collocation {
  en: string;
  zh: string;
}

export interface Word {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string[];
  definitions: WordDefinition[];
  examples: WordExample[];
  imageQuery: string;
  etymology?: string;
  etymologyParts?: EtymologyPart[];
  collocations?: Collocation[];
  synonyms?: string[];
  antonyms?: string[];
  memoryTip?: string;
}

export interface WordList {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  totalWords: number;
  description: string;
  icon: string;
  color: string;
}

export interface LearningRecord {
  wordId: string;
  correctCount: number;
  wrongCount: number;
  lastReviewDate: string;
  nextReviewDate: string;
  level: number;
  mastered: boolean;
}

export interface UserProgress {
  currentListId: string;
  dailyGoal: number;
  learnedToday: number;
  totalLearned: number;
  streak: number;
  lastStudyDate: string;
  records: Record<string, LearningRecord>;
  favorites: string[];
}

export interface DailyStats {
  date: string;
  learned: number;
  reviewed: number;
  correctRate: number;
  timeSpent: number;
}
