-- Migration: V4.0 Voice Engine & Health Sync
-- Sprint 1: Voice cloning, audio content, health data, TTS usage tracking

-- Voice profiles for cloned voices
CREATE TABLE voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  recorded_by UUID REFERENCES users(id),
  provider TEXT DEFAULT 'fish_audio' CHECK (provider IN ('fish_audio', 'elevenlabs')),
  provider_voice_id TEXT,
  audio_sample_url TEXT,
  duration_seconds INTEGER,
  quality_score REAL DEFAULT 0,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audio content catalog
CREATE TABLE audio_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('wellness', 'audiobook', 'exercise', 'radio', 'meditation', 'brain_game')),
  source_type TEXT CHECK (source_type IN ('rss', 'api', 'tts_generated', 'uploaded')),
  source_url TEXT,
  text_content TEXT,
  audio_url TEXT,
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  is_video BOOLEAN DEFAULT false,
  video_url TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Listen history
CREATE TABLE listen_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES audio_content(id),
  voice_profile_id UUID REFERENCES voice_profiles(id),
  listened_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Apple Health sync data
CREATE TABLE health_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  steps INTEGER,
  heart_rate_avg REAL,
  heart_rate_min REAL,
  heart_rate_max REAL,
  sleep_minutes INTEGER,
  active_energy_kcal REAL,
  stand_hours INTEGER,
  blood_oxygen_avg REAL,
  source TEXT DEFAULT 'apple_health',
  synced_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date, source)
);

-- TTS usage tracking for cost control
CREATE TABLE tts_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id),
  user_id UUID REFERENCES users(id),
  voice_profile_id UUID REFERENCES voice_profiles(id),
  character_count INTEGER NOT NULL,
  cost_usd REAL NOT NULL,
  provider TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_voice_profiles_family ON voice_profiles(family_id);
CREATE INDEX idx_audio_content_category ON audio_content(category);
CREATE INDEX idx_listen_history_user_date ON listen_history(user_id, created_at DESC);
CREATE INDEX idx_health_sync_user_date ON health_sync(user_id, date DESC);
CREATE INDEX idx_tts_usage_family_date ON tts_usage(family_id, created_at DESC);

-- RLS policies
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE listen_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE tts_usage ENABLE ROW LEVEL SECURITY;

-- Voice profiles: same family can read
CREATE POLICY voice_profiles_select ON voice_profiles FOR SELECT USING (
  family_id IN (SELECT family_id FROM users WHERE auth_id = auth.uid())
);
CREATE POLICY voice_profiles_insert ON voice_profiles FOR INSERT WITH CHECK (
  family_id IN (SELECT family_id FROM users WHERE auth_id = auth.uid())
);
CREATE POLICY voice_profiles_delete ON voice_profiles FOR DELETE USING (
  recorded_by IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Audio content: public read
CREATE POLICY audio_content_select ON audio_content FOR SELECT USING (true);

-- Listen history: own records only
CREATE POLICY listen_history_select ON listen_history FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);
CREATE POLICY listen_history_insert ON listen_history FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Health sync: same family can read
CREATE POLICY health_sync_select ON health_sync FOR SELECT USING (
  user_id IN (
    SELECT u2.id FROM users u1
    JOIN users u2 ON u1.family_id = u2.family_id
    WHERE u1.auth_id = auth.uid()
  )
);
CREATE POLICY health_sync_insert ON health_sync FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- TTS usage: same family can read
CREATE POLICY tts_usage_select ON tts_usage FOR SELECT USING (
  family_id IN (SELECT family_id FROM users WHERE auth_id = auth.uid())
);
