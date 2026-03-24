-- ============================================================================
-- FamilyPing V2.0 - Health Sensing: Daily Metrics, Anomalies, Weekly Summaries
-- ============================================================================

-- --------------------------------------------------------------------------
-- daily_metrics: health data synced from HealthKit / Health Connect
-- --------------------------------------------------------------------------
CREATE TABLE daily_metrics (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  steps         INT,
  active_hours  INT,
  checkin_time  TIME,
  mood          TEXT CHECK (mood IN ('great', 'ok', 'not_great')),
  sleep_minutes INT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, date)
);

CREATE INDEX idx_daily_metrics_user_date ON daily_metrics (user_id, date);

ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

-- Same-family members can view each other's metrics
CREATE POLICY "Family members can view metrics"
  ON daily_metrics FOR SELECT
  USING (
    user_id IN (
      SELECT u.id FROM users u
      WHERE u.family_id = (
        SELECT family_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Users can insert/update only their own metrics
CREATE POLICY "Users can insert own metrics"
  ON daily_metrics FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own metrics"
  ON daily_metrics FOR UPDATE
  USING (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- anomalies: detected deviations from baseline patterns
-- --------------------------------------------------------------------------
CREATE TABLE anomalies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('steps_low', 'inactive', 'late_checkin', 'mood_decline')),
  severity        TEXT NOT NULL CHECK (severity IN ('watch', 'alert')),
  metric_value    DOUBLE PRECISION,
  baseline_value  DOUBLE PRECISION,
  deviation       DOUBLE PRECISION,
  notified        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_anomalies_user_date ON anomalies (user_id, date);

ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;

-- Same-family members can view each other's anomalies
CREATE POLICY "Family members can view anomalies"
  ON anomalies FOR SELECT
  USING (
    user_id IN (
      SELECT u.id FROM users u
      WHERE u.family_id = (
        SELECT family_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Service role inserts anomalies (edge function), but allow user select
CREATE POLICY "Service role can insert anomalies"
  ON anomalies FOR INSERT
  WITH CHECK (true);

-- --------------------------------------------------------------------------
-- weekly_summaries: AI-generated weekly digests
-- --------------------------------------------------------------------------
CREATE TABLE weekly_summaries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start    DATE NOT NULL,
  summary_text  TEXT NOT NULL,
  highlights    JSONB DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, week_start)
);

CREATE INDEX idx_weekly_summaries_user_week ON weekly_summaries (user_id, week_start);

ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view weekly summaries"
  ON weekly_summaries FOR SELECT
  USING (
    user_id IN (
      SELECT u.id FROM users u
      WHERE u.family_id = (
        SELECT family_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Service role can insert weekly summaries"
  ON weekly_summaries FOR INSERT
  WITH CHECK (true);
