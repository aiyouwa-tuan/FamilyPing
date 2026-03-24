-- FamilyPing V1.0 Core Database Schema
-- Run this in Supabase SQL Editor

-- ==================== Core Tables ====================

-- Family
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'My Family',
  invite_code TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'family', 'smart', 'premium')),
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  role TEXT NOT NULL CHECK (role IN ('parent', 'family')),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  checkin_time TIME,
  alert_delay_minutes INT DEFAULT 120,
  push_token TEXT,
  avatar_emoji TEXT DEFAULT '👤',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ
);

-- Check-in Records
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  mood TEXT NOT NULL CHECK (mood IN ('great', 'ok', 'not_great')),
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  question_id INT,
  question_answer TEXT,
  checkin_delay_minutes INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_checkins_user_date ON checkins(user_id, checked_in_at DESC);

-- SOS Events
CREATE TABLE sos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_address TEXT,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  notes TEXT
);

-- Family Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  sender_id UUID NOT NULL REFERENCES users(id),
  recipient_role TEXT CHECK (recipient_role IN ('parent', 'family', 'all')),
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'photo')),
  media_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_family ON messages(family_id, created_at DESC);

-- ==================== RLS Policies ====================

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own family
CREATE POLICY "users_same_family" ON users
  FOR SELECT USING (
    family_id = (SELECT family_id FROM users WHERE id = auth.uid())
  );

-- Checkins: only see same family
CREATE POLICY "checkins_same_family" ON checkins
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users WHERE family_id = (
        SELECT family_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Parents can insert their own checkins
CREATE POLICY "checkins_insert_own" ON checkins
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- SOS: same family
CREATE POLICY "sos_same_family" ON sos_events
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users WHERE family_id = (
        SELECT family_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Messages: same family
CREATE POLICY "messages_same_family" ON messages
  FOR SELECT USING (
    family_id = (SELECT family_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "messages_insert_family" ON messages
  FOR INSERT WITH CHECK (
    family_id = (SELECT family_id FROM users WHERE id = auth.uid())
  );

-- Families: only see own family
CREATE POLICY "families_own" ON families
  FOR SELECT USING (
    id = (SELECT family_id FROM users WHERE id = auth.uid())
  );
