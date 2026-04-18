import type { StarEntry, Reward, Redemption } from '../types';

const KEYS = {
  ENTRIES: 'rs_entries',
  REWARDS: 'rs_rewards',
  REDEMPTIONS: 'rs_redemptions',
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

export const storage = {
  loadEntries: () => load<StarEntry[]>(KEYS.ENTRIES, []),
  saveEntries: (entries: StarEntry[]) => save(KEYS.ENTRIES, entries),

  loadRewards: () => load<Reward[]>(KEYS.REWARDS, []),
  saveRewards: (rewards: Reward[]) => save(KEYS.REWARDS, rewards),

  loadRedemptions: () => load<Redemption[]>(KEYS.REDEMPTIONS, []),
  saveRedemptions: (redemptions: Redemption[]) => save(KEYS.REDEMPTIONS, redemptions),

  hasSeeded: () => load<boolean>(KEYS.SEEDED, false),
  markSeeded: () => save(KEYS.SEEDED, true),
};
