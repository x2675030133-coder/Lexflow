export interface ArticleParagraph {
  en: string;
  zh: string;
}

export interface ArticleVocab {
  word: string;
  definition: string;
  phonetic: string;
}

export interface Article {
  id: string;
  titleEn: string;
  titleZh: string;
  category: string;
  date: string;
  source: string;
  sourceUrl?: string;
  paragraphs: ArticleParagraph[];
  vocabulary: ArticleVocab[];
}

export const articles: Article[] = [];

export const categoryLabels: Record<string, string> = {
  all: '全部',
  technology: '科技',
  culture: '文化',
  education: '教育',
  environment: '环保',
  news: '新闻',
};

export const categoryIcons: Record<string, string> = {
  technology: '💡',
  culture: '📚',
  education: '🎓',
  environment: '🌿',
  news: '📰',
};
