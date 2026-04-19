// ─── Core domain types ────────────────────────────────────────────────────────

export type SessionType = 'reading' | 'maths' | 'chores';

export interface Child {
  id: string;
  name: string;
  age?: number;
  createdAt: string;
}

export interface StarEntry {
  id: string;
  date: string;        // "YYYY-MM-DD"
  stars: number;       // positive = earned, negative = deducted
  sessionType?: SessionType; // undefined treated as 'reading' (backward compat)
  title?: string;      // canonical replacement for bookTitle
  bookTitle?: string;  // kept for backward compatibility
  note?: string;
  childId?: string;    // undefined = default/first child (backward compat)
  createdAt: string;   // ISO timestamp
}

export interface Reward {
  id: string;
  name: string;
  starCost: number;
  description?: string;
  tags?: string[];
  active: boolean;
  createdAt: string;
}

export interface Redemption {
  id: string;
  rewardId: string;
  rewardName: string;
  starCost: number;
  date: string;        // "YYYY-MM-DD"
  childId?: string;    // undefined = default/first child (backward compat)
  createdAt: string;
}

// ─── Flashcard types ─────────────────────────────────────────────────────────

export type FlashcardSubject = 'maths' | 'reading';

export type FlashcardLevel =
  | 'reception'
  | 'year1'
  | 'year2'
  | 'year3'
  | 'year4'
  | 'year5'
  | 'year6';

export type FlashcardMode =
  | 'number-recognition'
  | 'number-bonds'
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'letters'
  | 'phonics-cvc'
  | 'sight-words'
  | 'vocabulary'
  | 'spelling-patterns';

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  hint?: string;
}

export interface FlashcardDeck {
  subject: FlashcardSubject;
  level: FlashcardLevel;
  mode: FlashcardMode;
  modeLabel: string;
  description?: string;
  cards: Flashcard[];
}

export type FlashcardStatus = 'new' | 'learning' | 'reviewing' | 'mastered';
export type FlashcardSessionType = 'smart' | 'free';

export interface FlashcardProgress {
  id: string;              // `${childId}::${cardId}`
  childId: string;
  cardId: string;
  subject: FlashcardSubject;
  level: FlashcardLevel;
  mode: FlashcardMode;
  timesSeen: number;
  timesCorrect: number;
  timesIncorrect: number;
  currentStreak: number;
  lastSeenAt: string;
  lastResult: 'correct' | 'incorrect' | null;
  boxNumber: number;       // Leitner box 1-6
  nextDueAt: string;
  status: FlashcardStatus;
}

export interface FlashcardSession {
  id: string;
  childId: string;
  subject: FlashcardSubject;
  level: FlashcardLevel;
  mode: FlashcardMode;
  correct: number;
  incorrect: number;
  total: number;
  date: string;        // "YYYY-MM-DD"
  createdAt: string;
  sessionType?: FlashcardSessionType;
  numberRange?: { min: number; max: number };
}

// ─── Navigation types ─────────────────────────────────────────────────────────

export type Tab = 'dashboard' | 'log' | 'rewards' | 'stats' | 'flashcards';
export type RewardsView = 'wishlist' | 'manage';
export type HistoryView = 'timeline' | 'daily';
export type StatsView = 'overview' | 'history';
