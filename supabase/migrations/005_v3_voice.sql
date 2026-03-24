-- =============================================================================
-- FamilyPing V3.0 - AI Voice Calls
-- =============================================================================
-- Adds voice_calls and conversation_memory tables for AI-powered phone calls
-- with real-time transcription, DeepSeek conversation, and memory context.
-- =============================================================================

-- ============ Voice Calls ============
CREATE TABLE voice_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  transcript TEXT,
  summary TEXT,
  mood_score INT CHECK (mood_score >= 1 AND mood_score <= 10),
  key_topics JSONB DEFAULT '[]'::jsonb,
  highlights JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ Conversation Memory ============
CREATE TABLE conversation_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  sentiment TEXT,
  context TEXT NOT NULL,
  mention_count INT NOT NULL DEFAULT 1,
  first_mentioned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_mentioned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ Indexes ============
CREATE INDEX idx_voice_calls_user_started ON voice_calls(user_id, started_at DESC);
CREATE INDEX idx_voice_calls_user_created ON voice_calls(user_id, created_at DESC);
CREATE INDEX idx_conversation_memory_user ON conversation_memory(user_id);
CREATE INDEX idx_conversation_memory_user_topic ON conversation_memory(user_id, topic);
CREATE INDEX idx_conversation_memory_last_mentioned ON conversation_memory(user_id, last_mentioned_at DESC);

-- ============ RLS ============
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;

-- Voice calls: same family can read
CREATE POLICY "Users can read own voice calls"
  ON voice_calls FOR SELECT
  USING (
    user_id IN (
      SELECT u.id FROM users u
      WHERE u.family_id = (
        SELECT family_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Service role can insert voice calls"
  ON voice_calls FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update voice calls"
  ON voice_calls FOR UPDATE
  USING (true);

-- Conversation memory: same family can read
CREATE POLICY "Users can read family conversation memory"
  ON conversation_memory FOR SELECT
  USING (
    user_id IN (
      SELECT u.id FROM users u
      WHERE u.family_id = (
        SELECT family_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Service role can insert conversation memory"
  ON conversation_memory FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update conversation memory"
  ON conversation_memory FOR UPDATE
  USING (true);
