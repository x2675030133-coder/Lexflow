export interface SubtitleLine {
  id: number;
  startTime: number;
  endTime: number;
  en: string;
  zh: string;
  highlights: string[];
}

export interface VideoLesson {
  id: string;
  title: string;
  episode: number;
  speaker: string;
  category: string;
  thumbnail: string;
  duration: string;
  subtitles: SubtitleLine[];
}
