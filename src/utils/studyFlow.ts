import type { UserProgress, Word } from '../data/types';

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

export function isWordPending(word: Word, progress: UserProgress): boolean {
  const record = progress.records[word.id];
  if (!record) return true;
  if (record.mastered) return false;
  if (!record.nextReviewDate) return true;
  return record.nextReviewDate <= todayKey();
}

export function isNewStudyWord(word: Word, progress: UserProgress): boolean {
  const record = progress.records[word.id];
  if (!record) return true;
  return !record.mastered && record.correctCount === 0;
}

export function findNextStudyIndex(words: Word[], progress: UserProgress, startIndex = 0): number {
  if (!Array.isArray(words) || words.length === 0) return 0;

  const safeStart = Math.max(0, Math.min(startIndex, words.length - 1));
  for (let offset = 0; offset < words.length; offset += 1) {
    const index = (safeStart + offset) % words.length;
    if (isWordPending(words[index], progress)) {
      return index;
    }
  }

  return safeStart;
}

export function findNextNewStudyIndex(words: Word[], progress: UserProgress, startIndex = 0): number {
  if (!Array.isArray(words) || words.length === 0) return -1;

  const safeStart = Math.max(0, Math.min(startIndex, words.length - 1));
  for (let offset = 0; offset < words.length; offset += 1) {
    const index = (safeStart + offset) % words.length;
    if (isNewStudyWord(words[index], progress)) {
      return index;
    }
  }

  return -1;
}
