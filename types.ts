
export interface KanjiItem {
  id: number;
  week: number;
  kanji: string;
  reading: string;
  meaning: string;
}

export enum AppMode {
  FLASHCARD = 'FLASHCARD',
  DRAWING = 'DRAWING',
  TEST = 'TEST'
}

export type WeekFilter = 'Tümü' | '9' | '10' | '11' | '12' | '13' | '14' | '15';
