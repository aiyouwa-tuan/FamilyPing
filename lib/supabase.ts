import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// ---------------------------------------------------------------------------
// Supabase configuration
// ---------------------------------------------------------------------------
// Set these values in one of the following places (in order of precedence):
//   1. app.json -> expo.extra.supabaseUrl / supabaseAnonKey
//   2. Environment variables SUPABASE_URL / SUPABASE_ANON_KEY
//   3. The placeholder strings below (development only)
// ---------------------------------------------------------------------------

const SUPABASE_URL: string =
  Constants.expoConfig?.extra?.supabaseUrl ??
  process.env.SUPABASE_URL ??
  'https://uokqhrbiwqcyuszltsxk.supabase.co';

const SUPABASE_ANON_KEY: string =
  Constants.expoConfig?.extra?.supabaseAnonKey ??
  process.env.SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVva3FocmJpd3FjeXVzemx0c3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNDYyMTEsImV4cCI6MjA4OTkyMjIxMX0.NYYVZC2RKAVJvdAx44Y9AfS3TVqB15h3rn0a2YReHQ4';

// ---------------------------------------------------------------------------
// Simple in-memory storage adapter
// ---------------------------------------------------------------------------
// Replace this with @react-native-async-storage/async-storage for production:
//
//   import AsyncStorage from '@react-native-async-storage/async-storage';
//   const storage = AsyncStorage;
//
// The in-memory fallback works for development but does NOT persist sessions
// across app restarts.
// ---------------------------------------------------------------------------

const memoryStore: Record<string, string> = {};

const InMemoryStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return memoryStore[key] ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    memoryStore[key] = value;
  },
  removeItem: async (key: string): Promise<void> => {
    delete memoryStore[key];
  },
};

// ---------------------------------------------------------------------------
// Supabase client
// ---------------------------------------------------------------------------

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: InMemoryStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
