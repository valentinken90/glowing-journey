import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { StarEntry, Reward, Redemption, Child, FlashcardSession } from '../types';
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

const DEFAULT_CHILD: Child = {
  id: 'default-child',
  name: 'My Child',
  createdAt: new Date().toISOString(),
};

function getDemoEntries(childId: string): StarEntry[] {
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
      childId,
      createdAt: new Date(now.getTime() - 3600000).toISOString(),
    },
    {
      id: 'seed-e2',
      date: day(1),
      stars: 1,
      bookTitle: 'The Magic Faraway Tree',
      childId,
      createdAt: new Date(now.getTime() - 90000000).toISOString(),
    },
    {
      id: 'seed-e3',
      date: day(3),
      stars: 3,
      bookTitle: "Charlotte's Web",
      note: 'Finished the whole book!',
      childId,
      createdAt: new Date(now.getTime() - 300000000).toISOString(),
    },
  ];
}

// ─── State & actions ──────────────────────────────────────────────────────────

interface AppState {
  entries: StarEntry[];
  rewards: Reward[];
  redemptions: Redemption[];
  children: Child[];
  currentChildId: string | null;
  flashcardSessions: FlashcardSession[];
}

type Action =
  | { type: 'ADD_ENTRY'; payload: StarEntry }
  | { type: 'UPDATE_ENTRY'; payload: StarEntry }
  | { type: 'DELETE_ENTRY'; payload: string }
  | { type: 'ADD_REWARD'; payload: Reward }
  | { type: 'UPDATE_REWARD'; payload: Reward }
  | { type: 'DELETE_REWARD'; payload: string }
  | { type: 'ADD_REDEMPTION'; payload: Redemption }
  | { type: 'DELETE_REDEMPTION'; payload: string }
  | { type: 'ADD_CHILD'; payload: Child }
  | { type: 'UPDATE_CHILD'; payload: Child }
  | { type: 'DELETE_CHILD'; payload: string }
  | { type: 'SET_CURRENT_CHILD'; payload: string | null }
  | { type: 'ADD_FLASHCARD_SESSION'; payload: FlashcardSession };

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
    case 'ADD_CHILD':
      return { ...state, children: [...state.children, action.payload] };
    case 'UPDATE_CHILD':
      return {
        ...state,
        children: state.children.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'DELETE_CHILD': {
      const remaining = state.children.filter(c => c.id !== action.payload);
      const newCurrentId =
        state.currentChildId === action.payload
          ? (remaining[0]?.id ?? null)
          : state.currentChildId;
      return { ...state, children: remaining, currentChildId: newCurrentId };
    }
    case 'SET_CURRENT_CHILD':
      return { ...state, currentChildId: action.payload };
    case 'ADD_FLASHCARD_SESSION':
      return {
        ...state,
        flashcardSessions: [action.payload, ...state.flashcardSessions],
      };
  }
}

function initState(): AppState {
  const seeded = storage.hasSeeded();
  const savedRewards = storage.loadRewards();
  const rewards = savedRewards.length > 0 ? savedRewards : DEFAULT_REWARDS;

  // Load children — create default if none
  let children = storage.loadChildren();
  if (children.length === 0) {
    children = [DEFAULT_CHILD];
    storage.saveChildren(children);
  }
  let currentChildId = storage.loadCurrentChildId();
  if (!currentChildId || !children.find(c => c.id === currentChildId)) {
    currentChildId = children[0].id;
    storage.saveCurrentChildId(currentChildId);
  }

  const flashcardSessions = storage.loadFlashcardSessions();

  if (!seeded) {
    const entries = getDemoEntries(currentChildId);
    storage.saveEntries(entries);
    storage.saveRewards(DEFAULT_REWARDS);
    storage.saveRedemptions([]);
    storage.markSeeded();
    return {
      entries,
      rewards: DEFAULT_REWARDS,
      redemptions: [],
      children,
      currentChildId,
      flashcardSessions,
    };
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
      childId: currentChildId ?? undefined,
      createdAt: d.createdAt,
    }));
    const allEntries = [...loadedEntries, ...migrated];
    storage.saveEntries(allEntries);
    storage.saveDeductions([]);
    return {
      entries: allEntries,
      rewards,
      redemptions: storage.loadRedemptions(),
      children,
      currentChildId,
      flashcardSessions,
    };
  }

  return {
    entries: loadedEntries,
    rewards,
    redemptions: storage.loadRedemptions(),
    children,
    currentChildId,
    flashcardSessions,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  entries: StarEntry[];
  rewards: Reward[];
  redemptions: Redemption[];
  children: Child[];
  currentChild: Child | null;
  flashcardSessions: FlashcardSession[];

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

  addChild: (data: Omit<Child, 'id' | 'createdAt'>) => void;
  updateChild: (child: Child) => void;
  deleteChild: (id: string) => void;
  setCurrentChild: (id: string) => void;

  addFlashcardSession: (data: Omit<FlashcardSession, 'id' | 'createdAt'>) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children: reactChildren }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);

  useEffect(() => { storage.saveEntries(state.entries); }, [state.entries]);
  useEffect(() => { storage.saveRewards(state.rewards); }, [state.rewards]);
  useEffect(() => { storage.saveRedemptions(state.redemptions); }, [state.redemptions]);
  useEffect(() => { storage.saveChildren(state.children); }, [state.children]);
  useEffect(() => { storage.saveCurrentChildId(state.currentChildId); }, [state.currentChildId]);
  useEffect(() => { storage.saveFlashcardSessions(state.flashcardSessions); }, [state.flashcardSessions]);

  const currentChild = state.currentChildId
    ? (state.children.find(c => c.id === state.currentChildId) ?? state.children[0] ?? null)
    : (state.children[0] ?? null);

  // Filter entries and redemptions to current child
  const childEntries = state.entries.filter(
    e => !e.childId || e.childId === currentChild?.id
  );
  const childRedemptions = state.redemptions.filter(
    r => !r.childId || r.childId === currentChild?.id
  );

  const totalEarned = childEntries.filter(e => e.stars > 0).reduce((sum, e) => sum + e.stars, 0);
  const totalRedeemed = childRedemptions.reduce((sum, r) => sum + r.starCost, 0);
  const totalDeducted = Math.abs(childEntries.filter(e => e.stars < 0).reduce((sum, e) => sum + e.stars, 0));
  const availableStars = childEntries.reduce((sum, e) => sum + e.stars, 0) - totalRedeemed;
  const todayStars = childEntries
    .filter(e => e.date === todayStr())
    .reduce((sum, e) => sum + e.stars, 0);

  const quickAddStar = useCallback(() => {
    dispatch({
      type: 'ADD_ENTRY',
      payload: {
        id: generateId(),
        date: todayStr(),
        stars: 1,
        childId: currentChild?.id,
        createdAt: new Date().toISOString(),
      },
    });
  }, [currentChild]);

  const addEntry = useCallback(
    (data: Omit<StarEntry, 'id' | 'createdAt'>) => {
      dispatch({
        type: 'ADD_ENTRY',
        payload: {
          ...data,
          childId: data.childId ?? currentChild?.id,
          id: generateId(),
          createdAt: new Date().toISOString(),
        },
      });
    },
    [currentChild],
  );

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
        childEntries.reduce((s, e) => s + e.stars, 0) -
        childRedemptions.reduce((s, r) => s + r.starCost, 0);
      if (current < reward.starCost) return false;
      dispatch({
        type: 'ADD_REDEMPTION',
        payload: {
          id: generateId(),
          rewardId: reward.id,
          rewardName: reward.name,
          starCost: reward.starCost,
          date: todayStr(),
          childId: currentChild?.id,
          createdAt: new Date().toISOString(),
        },
      });
      return true;
    },
    [childEntries, childRedemptions, currentChild],
  );

  const deleteRedemption = useCallback((id: string) => {
    dispatch({ type: 'DELETE_REDEMPTION', payload: id });
  }, []);

  const addChild = useCallback((data: Omit<Child, 'id' | 'createdAt'>) => {
    const newChild: Child = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_CHILD', payload: newChild });
    dispatch({ type: 'SET_CURRENT_CHILD', payload: newChild.id });
  }, []);

  const updateChild = useCallback((child: Child) => {
    dispatch({ type: 'UPDATE_CHILD', payload: child });
  }, []);

  const deleteChild = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CHILD', payload: id });
  }, []);

  const setCurrentChild = useCallback((id: string) => {
    dispatch({ type: 'SET_CURRENT_CHILD', payload: id });
  }, []);

  const addFlashcardSession = useCallback(
    (data: Omit<FlashcardSession, 'id' | 'createdAt'>) => {
      dispatch({
        type: 'ADD_FLASHCARD_SESSION',
        payload: {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
        },
      });
    },
    [],
  );

  return (
    <AppContext.Provider
      value={{
        entries: childEntries,
        rewards: state.rewards,
        redemptions: childRedemptions,
        children: state.children,
        currentChild,
        flashcardSessions: state.flashcardSessions,
        availableStars,
        totalEarned,
        totalRedeemed,
        totalDeducted,
        todayStars,
        quickAddStar,
        addEntry, updateEntry, deleteEntry,
        addReward, updateReward, deleteReward,
        redeemReward, deleteRedemption,
        addChild, updateChild, deleteChild, setCurrentChild,
        addFlashcardSession,
      }}
    >
      {reactChildren}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
