
export interface KanjiItem {
  id: number;
  week: number;
  semester: number;
  kanji: string;
  reading: string;
  meaning: string;
}

export enum AppMode {
  FLASHCARD = 'FLASHCARD',
  DRAWING = 'DRAWING',
  TEST = 'TEST'
}

export type WeekFilter = 'Tümü' | string;
