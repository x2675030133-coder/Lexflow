export interface GeneratedReadingMeta {
  generatedAt: string;
  articleCount: number;
  sourceMode: 'model' | 'fallback';
  provider: string;
  sourceBriefCount: number;
  sourceNames: string[];
  targetArticleCount?: number;
  generationSchedule?: {
    hour: number;
    minute: number;
    label: string;
  };
}

export const generatedReadingMeta: GeneratedReadingMeta = {
  "generatedAt": "2026-04-22T06:55:05.444Z",
  "articleCount": 40,
  "sourceMode": "fallback",
  "provider": "deepseek",
  "sourceBriefCount": 16,
  "sourceNames": [
    "AI Editor"
  ],
  "targetArticleCount": 20,
  "generationSchedule": {
    "hour": 2,
    "minute": 0,
    "label": "每天 02:00"
  }
};
