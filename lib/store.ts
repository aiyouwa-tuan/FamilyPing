import { create } from 'zustand';
import type { User, Family, Checkin, Message, Mood, WeatherData } from './types';

// ============ Auth Store ============
interface AuthState {
  user: User | null;
  family: Family | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, family: Family) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  family: null,
  isAuthenticated: false,
  isLoading: true,
  login: (user, family) => set({ user, family, isAuthenticated: true, isLoading: false }),
  logout: () => set({ user: null, family: null, isAuthenticated: false, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// ============ Checkin Store ============
interface CheckinState {
  todayCheckin: Checkin | null;
  streak: number;
  history: Checkin[];
  setTodayCheckin: (checkin: Checkin) => void;
  setHistory: (history: Checkin[]) => void;
  setStreak: (streak: number) => void;
}

export const useCheckinStore = create<CheckinState>((set) => ({
  todayCheckin: null,
  streak: 0,
  history: [],
  setTodayCheckin: (todayCheckin) => set({ todayCheckin }),
  setHistory: (history) => set({ history }),
  setStreak: (streak) => set({ streak }),
}));

// ============ Family Store ============
interface FamilyState {
  members: User[];
  parentStatuses: Record<string, { checkin: Checkin | null; lastActive: string | null }>;
  messages: Message[];
  weather: WeatherData | null;
  setMembers: (members: User[]) => void;
  setParentStatus: (userId: string, status: { checkin: Checkin | null; lastActive: string | null }) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setWeather: (weather: WeatherData) => void;
}

export const useFamilyStore = create<FamilyState>((set) => ({
  members: [],
  parentStatuses: {},
  messages: [],
  weather: null,
  setMembers: (members) => set({ members }),
  setParentStatus: (userId, status) =>
    set((state) => ({
      parentStatuses: { ...state.parentStatuses, [userId]: status },
    })),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [message, ...state.messages] })),
  setWeather: (weather) => set({ weather }),
}));

// ============ Mock Data Helpers ============
export function loadMockData(role: 'parent' | 'family') {
  const family: Family = {
    id: 'fam-001',
    name: 'Robinson Family',
    invite_code: 'FP2024',
    plan: 'free',
    plan_expires_at: null,
    created_at: '2024-01-01T00:00:00Z',
  };

  if (role === 'parent') {
    const user: User = {
      id: 'user-parent-001',
      family_id: 'fam-001',
      role: 'parent',
      name: 'Mom',
      phone: '+1234567890',
      timezone: 'America/New_York',
      checkin_time: '09:00',
      alert_delay_minutes: 120,
      push_token: null,
      avatar_emoji: '👵',
      created_at: '2024-01-01T00:00:00Z',
      last_active_at: new Date().toISOString(),
    };
    useAuthStore.getState().login(user, family);

    useFamilyStore.getState().setWeather({
      temp: 72,
      description: 'Partly Cloudy',
      icon: '⛅',
      high: 78,
      low: 65,
      rain_chance: 20,
      city: 'New York',
    });

    useFamilyStore.getState().setMessages([
      {
        id: 'msg-001',
        family_id: 'fam-001',
        sender_id: 'user-family-001',
        recipient_role: 'parent',
        content: 'Love you mom! Have a great day today! 💕',
        message_type: 'text',
        media_url: null,
        read_at: null,
        created_at: new Date().toISOString(),
      },
    ]);
  } else {
    const user: User = {
      id: 'user-family-001',
      family_id: 'fam-001',
      role: 'family',
      name: 'Sarah',
      phone: '+1987654321',
      timezone: 'America/New_York',
      checkin_time: null,
      alert_delay_minutes: 120,
      push_token: null,
      avatar_emoji: '👩',
      created_at: '2024-01-01T00:00:00Z',
      last_active_at: new Date().toISOString(),
    };
    useAuthStore.getState().login(user, family);

    const parentUser: User = {
      id: 'user-parent-001',
      family_id: 'fam-001',
      role: 'parent',
      name: 'Mom',
      phone: '+1234567890',
      timezone: 'America/New_York',
      checkin_time: '09:00',
      alert_delay_minutes: 120,
      push_token: null,
      avatar_emoji: '👵',
      created_at: '2024-01-01T00:00:00Z',
      last_active_at: new Date().toISOString(),
    };
    useFamilyStore.getState().setMembers([parentUser]);

    // Mock 7-day checkin history
    const now = new Date();
    const history: Checkin[] = [];
    const moods: Mood[] = ['great', 'great', 'ok', 'great', 'not_great', 'great', 'ok'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(9, 15 + Math.floor(Math.random() * 30), 0, 0);
      if (i === 3) continue; // Skip one day for "missed"
      history.push({
        id: `ck-${i}`,
        user_id: 'user-parent-001',
        mood: moods[6 - i],
        checked_in_at: d.toISOString(),
        question_id: 6 - i + 1,
        question_answer: i === 0 ? 'I made beef stew, your favorite recipe!' : i === 1 ? 'Went to the park with Mrs. Chen' : null,
        checkin_delay_minutes: Math.floor(Math.random() * 20),
        created_at: d.toISOString(),
      });
    }

    useCheckinStore.getState().setHistory(history);
    useCheckinStore.getState().setStreak(3);

    const latestCheckin = history[history.length - 1];
    useFamilyStore.getState().setParentStatus('user-parent-001', {
      checkin: latestCheckin,
      lastActive: new Date().toISOString(),
    });

    useFamilyStore.getState().setMessages([
      {
        id: 'msg-002',
        family_id: 'fam-001',
        sender_id: 'user-parent-001',
        recipient_role: 'family',
        content: 'I made beef stew, your favorite recipe!',
        message_type: 'text',
        media_url: null,
        read_at: null,
        created_at: new Date().toISOString(),
      },
    ]);
  }
}
