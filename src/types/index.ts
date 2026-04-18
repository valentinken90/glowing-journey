export interface StarEntry {
  id: string;
  date: string;        // "YYYY-MM-DD"
  stars: number;
  bookTitle?: string;
  note?: string;
  createdAt: string;   // ISO timestamp
}

export interface Reward {
  id: string;
  name: string;
  starCost: number;
  description?: string;
  active: boolean;
  createdAt: string;
}

export interface Redemption {
  id: string;
  rewardId: string;
  rewardName: string;
  starCost: number;
  date: string;        // "YYYY-MM-DD"
  createdAt: string;
}

export type Tab = 'dashboard' | 'log' | 'rewards' | 'history';
export type RewardsView = 'wishlist' | 'manage';
export type HistoryView = 'timeline' | 'daily';
