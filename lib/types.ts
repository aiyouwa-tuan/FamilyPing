export type UserRole = 'parent' | 'family';
export type Mood = 'great' | 'ok' | 'not_great';
export type Plan = 'free' | 'family' | 'smart' | 'premium';

export interface Family {
  id: string;
  name: string;
  invite_code: string;
  plan: Plan;
  plan_expires_at: string | null;
  created_at: string;
}

export interface User {
  id: string;
  family_id: string;
  role: UserRole;
  name: string;
  phone: string;
  timezone: string;
  checkin_time: string | null; // HH:mm
  alert_delay_minutes: number;
  push_token: string | null;
  avatar_emoji: string;
  created_at: string;
  last_active_at: string | null;
}

export interface Checkin {
  id: string;
  user_id: string;
  mood: Mood;
  checked_in_at: string;
  question_id: number | null;
  question_answer: string | null;
  checkin_delay_minutes: number | null;
  created_at: string;
}

export interface SOSEvent {
  id: string;
  user_id: string;
  triggered_at: string;
  location_lat: number | null;
  location_lng: number | null;
  location_address: string | null;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  notes: string | null;
}

export interface Message {
  id: string;
  family_id: string;
  sender_id: string;
  recipient_role: 'parent' | 'family' | 'all';
  content: string;
  message_type: 'text' | 'voice' | 'photo';
  media_url: string | null;
  read_at: string | null;
  created_at: string;
}

export interface DailyQuestion {
  id: number;
  category: 'memory' | 'daily' | 'emotion' | 'fun';
  text_en: string;
  text_zh: string;
}

export interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  high: number;
  low: number;
  rain_chance: number;
  city: string;
}
