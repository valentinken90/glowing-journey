import type { Flashcard, FlashcardDeck, FlashcardLevel, FlashcardMode, FlashcardProgress, FlashcardStatus, FlashcardSubject } from '../types';

// Leitner box intervals in ms (index = box number 0–6, box 0 unused)
const BOX_INTERVALS_MS = [0, 0, 86_400_000, 259_200_000, 604_800_000, 1_209_600_000, 2_592_000_000];

const SMART_SESSION_SIZE = 15;
const MAX_NEW_PER_SESSION = 5;

export interface NumberRange {
  min: number;
  max: number;
  label: string;
}

export const NUMBER_RANGE_PRESETS: NumberRange[] = [
  { min: 1, max: 10, label: '1 – 10' },
  { min: 1, max: 20, label: '1 – 20' },
  { min: 1, max: 50, label: '1 – 50' },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function boxToStatus(box: number): FlashcardStatus {
  if (box <= 1) return 'new';
  if (box <= 2) return 'learning';
  if (box <= 4) return 'reviewing';
  return 'mastered';
}

export function createProgress(
  childId: string,
  cardId: string,
  subject: FlashcardSubject,
  level: FlashcardLevel,
  mode: FlashcardMode,
): FlashcardProgress {
  const now = new Date().toISOString();
  return {
    id: `${childId}::${cardId}`,
    childId,
    cardId,
    subject,
    level,
    mode,
    timesSeen: 0,
    timesCorrect: 0,
    timesIncorrect: 0,
    currentStreak: 0,
    lastSeenAt: now,
    lastResult: null,
    boxNumber: 1,
    nextDueAt: now,
    status: 'new',
  };
}

export function applyAnswer(progress: FlashcardProgress, correct: boolean): FlashcardProgress {
  const now = new Date();
  const newBox = correct ? Math.min(progress.boxNumber + 1, 6) : 1;
  const intervalMs = BOX_INTERVALS_MS[newBox] ?? 0;
  const nextDueAt = new Date(now.getTime() + intervalMs).toISOString();
  return {
    ...progress,
    timesSeen: progress.timesSeen + 1,
    timesCorrect: correct ? progress.timesCorrect + 1 : progress.timesCorrect,
    timesIncorrect: correct ? progress.timesIncorrect : progress.timesIncorrect + 1,
    currentStreak: correct ? progress.currentStreak + 1 : 0,
    lastSeenAt: now.toISOString(),
    lastResult: correct ? 'correct' : 'incorrect',
    boxNumber: newBox,
    nextDueAt,
    status: boxToStatus(newBox),
  };
}

export function getMasteryPct(p: FlashcardProgress): number {
  if (p.timesSeen === 0) return 0;
  return Math.round((p.timesCorrect / p.timesSeen) * 100);
}

export function buildSmartQueue(
  cards: Flashcard[],
  progressByCardId: Map<string, FlashcardProgress>,
): Flashcard[] {
  const now = Date.now();
  const due: Flashcard[] = [];
  const weak: Flashcard[] = [];
  const newCards: Flashcard[] = [];
  const mastered: Flashcard[] = [];

  for (const card of cards) {
    const p = progressByCardId.get(card.id);
    if (!p || p.status === 'new') {
      newCards.push(card);
    } else if (new Date(p.nextDueAt).getTime() <= now) {
      due.push(card);
    } else if (getMasteryPct(p) < 70 && p.timesSeen >= 2) {
      weak.push(card);
    } else if (p.status === 'mastered') {
      mastered.push(card);
    }
  }

  // Most overdue first
  due.sort((a, b) => {
    const pa = progressByCardId.get(a.id)!;
    const pb = progressByCardId.get(b.id)!;
    return new Date(pa.nextDueAt).getTime() - new Date(pb.nextDueAt).getTime();
  });

  // Lowest accuracy first
  weak.sort((a, b) => getMasteryPct(progressByCardId.get(a.id)!) - getMasteryPct(progressByCardId.get(b.id)!));

  const shuffledNew = shuffleArray(newCards).slice(0, MAX_NEW_PER_SESSION);
  const shuffledMastered = shuffleArray(mastered);

  const queue: Flashcard[] = [];
  const seen = new Set<string>();

  for (const card of [...due, ...weak, ...shuffledNew, ...shuffledMastered]) {
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    queue.push(card);
    if (queue.length >= SMART_SESSION_SIZE) break;
  }

  return queue;
}

export function reinsertCard(queue: Flashcard[], card: Flashcard): Flashcard[] {
  const insertAt = Math.min(3, queue.length);
  return [...queue.slice(0, insertAt), card, ...queue.slice(insertAt)];
}

export function filterByNumberRange(cards: Flashcard[], min: number, max: number): Flashcard[] {
  return cards.filter(c => {
    const n = Number(c.question);
    return !isNaN(n) && n >= min && n <= max;
  });
}

export function isNumberRecognitionDeck(deck: FlashcardDeck): boolean {
  return deck.mode === 'number-recognition';
}

export function getDueCount(cards: Flashcard[], progressByCardId: Map<string, FlashcardProgress>): number {
  const now = Date.now();
  return cards.filter(c => {
    const p = progressByCardId.get(c.id);
    return p && p.status !== 'new' && new Date(p.nextDueAt).getTime() <= now;
  }).length;
}

export function getWeakCount(cards: Flashcard[], progressByCardId: Map<string, FlashcardProgress>): number {
  return cards.filter(c => {
    const p = progressByCardId.get(c.id);
    return p && p.timesSeen >= 2 && getMasteryPct(p) < 70;
  }).length;
}

export function getNewCount(cards: Flashcard[], progressByCardId: Map<string, FlashcardProgress>): number {
  return cards.filter(c => {
    const p = progressByCardId.get(c.id);
    return !p || p.status === 'new';
  }).length;
}
