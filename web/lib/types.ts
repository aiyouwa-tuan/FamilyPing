export type Mood = 'great' | 'ok' | 'not_great'

export interface Family {
  id: string
  name: string
  invite_code: string
  plan?: string
  created_at: string
  timezone: string
}

export interface User {
  id: string
  auth_id: string
  family_id: string
  name: string
  role: 'parent' | 'family_member'
  email: string
  phone?: string
  avatar_emoji?: string
  avatar_url?: string
  checkin_time?: string
  timezone?: string
  created_at: string
}

export interface Checkin {
  id: string
  user_id: string
  family_id: string
  mood: Mood
  note?: string
  question?: string
  question_answer?: string
  answer?: string
  created_at: string
}

export interface Message {
  id: string
  family_id: string
  sender_id: string
  sender_name?: string
  recipient_id?: string
  content: string
  message_type: 'text' | 'photo' | 'voice'
  channel?: string
  read: boolean
  created_at: string
}

export interface SOSEvent {
  id: string
  user_id: string
  family_id: string
  status: 'active' | 'resolved' | 'false_alarm'
  resolved_at?: string
  created_at: string
}

export interface DailyMetric {
  id: string
  user_id: string
  date: string
  steps?: number
  heart_rate_avg?: number
  sleep_hours?: number
  sleep_quality?: string
  created_at: string
}

export interface Anomaly {
  id: string
  user_id: string
  family_id: string
  type: string
  description: string
  severity: 'low' | 'medium' | 'high'
  acknowledged: boolean
  created_at: string
}

export interface DailyInsight {
  id: string
  family_id: string
  user_id: string
  date: string
  status?: string
  insight: string
  summary?: string
  insights?: string[]
  suggestion?: string
  category: string
  weather_alert?: string
  created_at: string
}

export interface WeeklySummary {
  id: string
  family_id: string
  user_id: string
  week_start: string
  summary: string
  highlights: string[]
  concerns: string[]
  created_at: string
}

export interface VoiceCall {
  id: string
  family_id: string
  caller_id: string
  receiver_id: string
  duration_seconds?: number
  mood_score?: number
  summary?: string
  topics?: string[]
  status: 'initiated' | 'ringing' | 'connected' | 'ended' | 'missed'
  created_at: string
}

export interface ConversationMemory {
  id: string
  family_id: string
  user_id: string
  topic: string
  detail?: string
  last_mentioned?: string
  mention_count?: number
  created_at: string
}
