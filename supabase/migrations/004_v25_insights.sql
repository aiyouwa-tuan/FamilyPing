-- =============================================================================
-- FamilyPing V2.5 - Daily Insights (AI Brain)
-- =============================================================================

-- Daily AI-generated insights for each parent user
CREATE TABLE IF NOT EXISTS daily_insights (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('good', 'watch', 'concern')),
  summary     TEXT NOT NULL,
  insights    JSONB NOT NULL DEFAULT '[]'::jsonb,
  suggestion  JSONB NOT NULL DEFAULT '{}'::jsonb,
  weather_alert TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

-- Index for fast lookups by user + date
CREATE INDEX idx_daily_insights_user_date ON daily_insights (user_id, date DESC);

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE daily_insights ENABLE ROW LEVEL SECURITY;

-- Family members can read insights for users in the same family
CREATE POLICY "Family members can read insights"
  ON daily_insights
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users AS viewer
      JOIN users AS target ON viewer.family_id = target.family_id
      WHERE viewer.id = auth.uid()
        AND target.id = daily_insights.user_id
    )
  );

-- Service role (edge functions) can insert/update via service key,
-- but individual users can only insert their own
CREATE POLICY "Users can insert own insights"
  ON daily_insights
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own insights"
  ON daily_insights
  FOR UPDATE
  USING (user_id = auth.uid());
