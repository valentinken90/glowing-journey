import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { StarEntry, Reward, Redemption } from '../types';
import { storage } from '../utils/storage';
import { generateId, todayStr } from '../utils/helpers';

// ─── Seed data ────────────────────────────────────────────────────────────────

const DEFAULT_REWARDS: Reward[] = [
  {
    id: 'seed-r1',
    name: 'One episode of Bluey',
    starCost: 1,
    description: 'Watch one episode of Bluey on TV',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-r2',
    name: 'Special dessert',
    starCost: 3,
    description: 'Choose any special dessert you fancy',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-r3',
    name: 'Choose a family film',
    starCost: 5,
    description: 'Pick a film for the whole family to watch together',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

function getDemoEntries(): StarEntry[] {
  const now = new Date();
  const day = (offset: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - offset);
    return d.toISOString().slice(0, 10);
  };
  return [
    {
      id: 'seed-e1',
      date: day(0),
      stars: 2,
      bookTitle: 'Charlie and the Chocolate Factory',
      note: 'Read two whole chapters!',
      createdAt: new Date(now.getTime() - 3600000).toISOString(),
    },
    {
      id: 'seed-e2',
      date: day(1),
      stars: 1,
      bookTitle: 'The Magic Faraway Tree',
      createdAt: new Date(now.getTime() - 90000000).toISOString(),
    },
    {
      id: 'seed-e3',
      date: day(3),
      stars: 3,
      bookTitle: "Charlotte's Web",
      note: 'Finished the whole book!',
      createdAt: new Date(now.getTime() - 300000000).toISOString(),
    },
  ];
}

// ─── State & actions ──────────────────────────────────────────────────────────

interface AppState {
  entries: StarEntry[];
  rewards: Reward[];
  redemptions: Redemption[];
}

type Action =
  | { type: 'ADD_ENTRY'; payload: StarEntry }
  | { type: 'UPDATE_ENTRY'; payload: StarEntry }
  | { type: 'DELETE_ENTRY'; payload: string }
  | { type: 'ADD_REWARD'; payload: Reward }
  | { type: 'UPDATE_REWARD'; payload: Reward }
  | { type: 'DELETE_REWARD'; payload: string }
  | { type: 'ADD_REDEMPTION'; payload: Redemption }
  | { type: 'DELETE_REDEMPTION'; payload: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_ENTRY':
      return { ...state, entries: [action.payload, ...state.entries] };
    case 'UPDATE_ENTRY':
      return {
        ...state,
        entries: state.entries.map(e =>
          e.id === action.payload.id ? action.payload : e
        ),
      };
    case 'DELETE_ENTRY':
      return { ...state, entries: state.entries.filter(e => e.id !== action.payload) };
    case 'ADD_REWARD':
      return { ...state, rewards: [...state.rewards, action.payload] };
    case 'UPDATE_REWARD':
      return {
        ...state,
        rewards: state.rewards.map(r =>
          r.id === action.payload.id ? action.payload : r
        ),
      };
    case 'DELETE_REWARD':
      return { ...state, rewards: state.rewards.filter(r => r.id !== action.payload) };
    case 'ADD_REDEMPTION':
      return { ...state, redemptions: [action.payload, ...state.redemptions] };
    case 'DELETE_REDEMPTION':
      return {
        ...state,
        redemptions: state.redemptions.filter(r => r.id !== action.payload),
      };
  }
}

function initState(): AppState {
  const seeded = storage.hasSeeded();
  const savedRewards = storage.loadRewards();
  const rewards = savedRewards.length > 0 ? savedRewards : DEFAULT_REWARDS;

  if (!seeded) {
    const entries = getDemoEntries();
    storage.saveEntries(entries);
    storage.saveRewards(DEFAULT_REWARDS);
    storage.saveRedemptions([]);
    storage.markSeeded();
    return { entries, rewards: DEFAULT_REWARDS, redemptions: [] };
  }

  // Migrate old StarDeduction records → negative StarEntry records
  const loadedEntries = storage.loadEntries();
  const oldDeductions = storage.loadDeductions();
  if (oldDeductions.length > 0) {
    const migrated: StarEntry[] = oldDeductions.map(d => ({
      id: d.id,
      date: d.date,
      stars: -d.stars,
      bookTitle: d.reason,
      createdAt: d.createdAt,
    }));
    const allEntries = [...loadedEntries, ...migrated];
    storage.saveEntries(allEntries);
    storage.saveDeductions([]);
    return { entries: allEntries, rewards, redemptions: storage.loadRedemptions() };
  }

  return {
    entries: loadedEntries,
    rewards,
    redemptions: storage.loadRedemptions(),
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  entries: StarEntry[];
  rewards: Reward[];
  redemptions: Redemption[];

  availableStars: number;
  totalEarned: number;
  totalRedeemed: number;
  totalDeducted: number;
  todayStars: number;

  quickAddStar: () => void;
  addEntry: (data: Omit<StarEntry, 'id' | 'createdAt'>) => void;
  updateEntry: (entry: StarEntry) => void;
  deleteEntry: (id: string) => void;

  addReward: (data: Omit<Reward, 'id' | 'createdAt'>) => void;
  updateReward: (reward: Reward) => void;
  deleteReward: (id: string) => void;

  redeemReward: (reward: Reward) => boolean;
  deleteRedemption: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);

  useEffect(() => { storage.saveEntries(state.entries); }, [state.entries]);
  useEffect(() => { storage.saveRewards(state.rewards); }, [state.rewards]);
  useEffect(() => { storage.saveRedemptions(state.redemptions); }, [state.redemptions]);

  const totalEarned = state.entries.filter(e => e.stars > 0).reduce((sum, e) => sum + e.stars, 0);
  const totalRedeemed = state.redemptions.reduce((sum, r) => sum + r.starCost, 0);
  const totalDeducted = Math.abs(state.entries.filter(e => e.stars < 0).reduce((sum, e) => sum + e.stars, 0));
  const availableStars = state.entries.reduce((sum, e) => sum + e.stars, 0) - totalRedeemed;
  const todayStars = state.entries
    .filter(e => e.date === todayStr())
    .reduce((sum, e) => sum + e.stars, 0);

  const quickAddStar = useCallback(() => {
    dispatch({
      type: 'ADD_ENTRY',
      payload: { id: generateId(), date: todayStr(), stars: 1, createdAt: new Date().toISOString() },
    });
  }, []);

  const addEntry = useCallback((data: Omit<StarEntry, 'id' | 'createdAt'>) => {
    dispatch({ type: 'ADD_ENTRY', payload: { ...data, id: generateId(), createdAt: new Date().toISOString() } });
  }, []);

  const updateEntry = useCallback((entry: StarEntry) => {
    dispatch({ type: 'UPDATE_ENTRY', payload: entry });
  }, []);

  const deleteEntry = useCallback((id: string) => {
    dispatch({ type: 'DELETE_ENTRY', payload: id });
  }, []);

  const addReward = useCallback((data: Omit<Reward, 'id' | 'createdAt'>) => {
    dispatch({ type: 'ADD_REWARD', payload: { ...data, id: generateId(), createdAt: new Date().toISOString() } });
  }, []);

  const updateReward = useCallback((reward: Reward) => {
    dispatch({ type: 'UPDATE_REWARD', payload: reward });
  }, []);

  const deleteReward = useCallback((id: string) => {
    dispatch({ type: 'DELETE_REWARD', payload: id });
  }, []);

  const redeemReward = useCallback(
    (reward: Reward): boolean => {
      const current =
        state.entries.reduce((s, e) => s + e.stars, 0) -
        state.redemptions.reduce((s, r) => s + r.starCost, 0);
      if (current < reward.starCost) return false;
      dispatch({
        type: 'ADD_REDEMPTION',
        payload: {
          id: generateId(),
          rewardId: reward.id,
          rewardName: reward.name,
          starCost: reward.starCost,
          date: todayStr(),
          createdAt: new Date().toISOString(),
        },
      });
      return true;
    },
    [state.entries, state.redemptions]
  );

  const deleteRedemption = useCallback((id: string) => {
    dispatch({ type: 'DELETE_REDEMPTION', payload: id });
  }, []);

  return (
    <AppContext.Provider
      value={{
        entries: state.entries,
        rewards: state.rewards,
        redemptions: state.redemptions,
        availableStars,
        totalEarned,
        totalRedeemed,
        totalDeducted,
        todayStars,
        quickAddStar,
        addEntry, updateEntry, deleteEntry,
        addReward, updateReward, deleteReward,
        redeemReward, deleteRedemption,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
