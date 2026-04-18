import type { StarEntry, Reward, Redemption } from '../types';

const KEYS = {
  ENTRIES: 'rs_entries',
  REWARDS: 'rs_rewards',
  REDEMPTIONS: 'rs_redemptions',
  DEDUCTIONS: 'rs_deductions',
  SEEDED: 'rs_seeded',
} as const;

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

// Legacy shape used only for migrating old deduction records
interface LegacyDeduction { id: string; stars: number; reason: string; date: string; createdAt: string; }

export const storage = {
  loadEntries: () => load<StarEntry[]>(KEYS.ENTRIES, []),
  saveEntries: (entries: StarEntry[]) => save(KEYS.ENTRIES, entries),

  loadRewards: () => load<Reward[]>(KEYS.REWARDS, []),
  saveRewards: (rewards: Reward[]) => save(KEYS.REWARDS, rewards),

  loadRedemptions: () => load<Redemption[]>(KEYS.REDEMPTIONS, []),
  saveRedemptions: (redemptions: Redemption[]) => save(KEYS.REDEMPTIONS, redemptions),

  loadDeductions: () => load<LegacyDeduction[]>(KEYS.DEDUCTIONS, []),
  saveDeductions: (d: LegacyDeduction[]) => save(KEYS.DEDUCTIONS, d),

  hasSeeded: () => load<boolean>(KEYS.SEEDED, false),
  markSeeded: () => save(KEYS.SEEDED, true),
};
