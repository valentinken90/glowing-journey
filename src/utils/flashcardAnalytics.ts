import type { FlashcardProgress, FlashcardSession, FlashcardSubject } from '../types';

export interface MasteryBreakdown {
  new: number;
  learning: number;
  reviewing: number;
  mastered: number;
  total: number;
}

export interface WeakCard {
  cardId: string;
  subject: FlashcardSubject;
  level: string;
  mode: string;
  timesSeen: number;
  timesIncorrect: number;
  accuracy: number;
}

export function getMasteryBreakdown(progress: FlashcardProgress[]): MasteryBreakdown {
  const counts = { new: 0, learning: 0, reviewing: 0, mastered: 0 };
  for (const p of progress) {
    counts[p.status] = (counts[p.status] ?? 0) + 1;
  }
  return { ...counts, total: progress.length };
}

export function getDueCount(progress: FlashcardProgress[]): number {
  const now = Date.now();
  return progress.filter(
    p => p.status !== 'new' && new Date(p.nextDueAt).getTime() <= now,
  ).length;
}

export function getWeakCards(progress: FlashcardProgress[], limit = 12): WeakCard[] {
  return progress
    .filter(p => p.timesSeen >= 2 && p.timesIncorrect > 0)
    .map(p => ({
      cardId: p.cardId,
      subject: p.subject,
      level: p.level,
      mode: p.mode,
      timesSeen: p.timesSeen,
      timesIncorrect: p.timesIncorrect,
      accuracy: Math.round((p.timesCorrect / p.timesSeen) * 100),
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
}

export function getAccuracyBySubject(
  progress: FlashcardProgress[],
): Partial<Record<FlashcardSubject, number>> {
  const buckets: Partial<Record<FlashcardSubject, { correct: number; total: number }>> = {};
  for (const p of progress) {
    if (p.timesSeen === 0) continue;
    if (!buckets[p.subject]) buckets[p.subject] = { correct: 0, total: 0 };
    buckets[p.subject]!.correct += p.timesCorrect;
    buckets[p.subject]!.total += p.timesSeen;
  }
  const result: Partial<Record<FlashcardSubject, number>> = {};
  for (const subject of Object.keys(buckets) as FlashcardSubject[]) {
    const b = buckets[subject]!;
    result[subject] = b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0;
  }
  return result;
}

export function getWeeklyAccuracy(sessions: FlashcardSession[]): number | null {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const recent = sessions.filter(s => new Date(s.createdAt) >= cutoff);
  if (recent.length === 0) return null;
  const correct = recent.reduce((s, r) => s + r.correct, 0);
  const total = recent.reduce((s, r) => s + r.total, 0);
  return total > 0 ? Math.round((correct / total) * 100) : null;
}
