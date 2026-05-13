export interface GeneratedReadingMeta {
  generatedAt: string;
  articleCount: number;
  sourceMode: 'model' | 'fallback';
  provider: string;
  sourceBriefCount: number;
  sourceNames: string[];
  targetArticleCount?: number;
  batchIndex?: number;
  generationSchedule?: {
    hour: number;
    minute: number;
    label: string;
  };
}

export const generatedReadingMeta: GeneratedReadingMeta = {
  "generatedAt": "2026-05-06T02:58:35.417Z",
  "articleCount": 300,
  "sourceMode": "fallback",
  "provider": "template",
  "sourceBriefCount": 0,
  "sourceNames": [
    "LexFlow Studio"
  ],
  "targetArticleCount": 300,
  "batchIndex": 1,
  "generationSchedule": {
    "hour": 2,
    "minute": 0,
    "label": "每天 02:00"
  }
};
