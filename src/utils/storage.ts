import type { StarEntry, Reward, Redemption, Child, FlashcardSession, FlashcardProgress } from '../types';

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEYS = {
  ENTRIES: 'rs_entries',
  REWARDS: 'rs_rewards',
  REDEMPTIONS: 'rs_redemptions',
  DEDUCTIONS: 'rs_deductions',     // legacy — kept for migration
  SEEDED: 'rs_seeded',
  CHILDREN: 'rs_children',
  CURRENT_CHILD_ID: 'rs_current_child_id',
  FLASHCARD_SESSIONS: 'rs_flashcard_sessions',
  FLASHCARD_PROGRESS: 'rs_flashcard_progress',
} as const;

// ─── Generic helpers ──────────────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

// ─── Legacy shape — only used for migrating old deduction records ─────────────

export interface LegacyDeduction {
  id: string;
  stars: number;
  reason: string;
  date: string;
  createdAt: string;
}

// ─── Storage API ──────────────────────────────────────────────────────────────

export const storage = {
  // Entries
  loadEntries: () => load<StarEntry[]>(KEYS.ENTRIES, []),
  saveEntries: (entries: StarEntry[]) => save(KEYS.ENTRIES, entries),

  // Rewards
  loadRewards: () => load<Reward[]>(KEYS.REWARDS, []),
  saveRewards: (rewards: Reward[]) => save(KEYS.REWARDS, rewards),

  // Redemptions
  loadRedemptions: () => load<Redemption[]>(KEYS.REDEMPTIONS, []),
  saveRedemptions: (redemptions: Redemption[]) => save(KEYS.REDEMPTIONS, redemptions),

  // Legacy deductions (migration only)
  loadDeductions: () => load<LegacyDeduction[]>(KEYS.DEDUCTIONS, []),
  saveDeductions: (d: LegacyDeduction[]) => save(KEYS.DEDUCTIONS, d),

  // Seed flag
  hasSeeded: () => load<boolean>(KEYS.SEEDED, false),
  markSeeded: () => save(KEYS.SEEDED, true),

  // Children
  loadChildren: () => load<Child[]>(KEYS.CHILDREN, []),
  saveChildren: (children: Child[]) => save(KEYS.CHILDREN, children),

  // Current child
  loadCurrentChildId: () => load<string | null>(KEYS.CURRENT_CHILD_ID, null),
  saveCurrentChildId: (id: string | null) => save(KEYS.CURRENT_CHILD_ID, id),

  // Flashcard sessions
  loadFlashcardSessions: () => load<FlashcardSession[]>(KEYS.FLASHCARD_SESSIONS, []),
  saveFlashcardSessions: (sessions: FlashcardSession[]) => save(KEYS.FLASHCARD_SESSIONS, sessions),

  // Flashcard progress (spaced repetition state)
  loadFlashcardProgress: () => load<FlashcardProgress[]>(KEYS.FLASHCARD_PROGRESS, []),
  saveFlashcardProgress: (progress: FlashcardProgress[]) => save(KEYS.FLASHCARD_PROGRESS, progress),
};
