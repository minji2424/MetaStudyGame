export interface ConceptItem {
  id: string;
  term: string;
  englishTerm?: string;
  definition: string;
  keyPoint: string;
  mnemonic?: string;
  difficulty: 1 | 2 | 3;
  category?: string;
  masteryScore?: number; // 0 to 100
}

export interface BossQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  trapTip?: string;
}

export interface BlankQuestion {
  id: string;
  sentenceWithBlank: string;
  answer: string;
  distractors: string[];
  hint?: string;
}

export interface OXQuestion {
  id: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  tip?: string;
  status?: 'new' | 'learning' | 'mastered';
}

export interface StudyPack {
  id: string;
  title: string;
  major: string;
  summary: string;
  estimatedStudyTimeMinutes: number;
  concepts: ConceptItem[];
  bossBattle: BossQuestion[];
  blankShooter: BlankQuestion[];
  oxSurvival: OXQuestion[];
  flashcards: FlashcardItem[];
  createdAt: string;
  sourceFileName?: string;
  stats?: {
    matchHighScore?: number;
    bossDefeated?: boolean;
    bossBestScore?: number;
    blankHighScore?: number;
    oxBestStreak?: number;
    cardsMasteredCount?: number;
    timesStudied?: number;
  };
}

export type GameMode = 'overview' | 'match' | 'boss' | 'blank' | 'ox' | 'flashcards' | 'cheatsheet';

export interface UserProgress {
  xp: number;
  level: number;
  levelTitle: string;
  streakDays: number;
  totalGamesPlayed: number;
  correctAnswersCount: number;
  bossesDefeatedCount: number;
  soundEnabled: boolean;
  activePackId: string | null;
}
