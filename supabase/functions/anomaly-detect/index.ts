import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =============================================================================
// FamilyPing V2.0 - Anomaly Detection Edge Function
// =============================================================================
// Designed to run via pg_cron daily at 22:00 local time.
// Analyzes each parent user's daily_metrics against their 14-day baseline,
// with separate weekend/weekday baselines. Inserts anomaly records and
// sends push alerts for severe deviations.
// =============================================================================

type AnomalyType = "steps_low" | "inactive" | "late_checkin" | "mood_decline";
type Severity = "watch" | "alert";

interface Baseline {
  avg: number;
  stddev: number;
}

interface MetricRow {
  steps: number | null;
  active_hours: number | null;
  checkin_time: string | null;
  mood: string | null;
  date: string;
}

const MOOD_SCORE: Record<string, number> = {
  great: 3,
  ok: 2,
  not_great: 1,
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isWeekend(dateStr: string): boolean {
  const day = new Date(dateStr).getDay();
  return day === 0 || day === 6;
}

function computeBaseline(values: number[]): Baseline | null {
  if (values.length < 7) return null; // need enough data points
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const variance =
    values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
  const stddev = Math.sqrt(variance);
  return { avg, stddev: stddev || 1 }; // avoid division by zero
}

function checkinTimeToMinutes(time: string | null): number | null {
  if (!time) return null;
  const parts = time.split(":");
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

async function sendExpoPush(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  const messages = tokens
    .filter((t) => t)
    .map((token) => ({
      to: token,
      sound: "default",
      title,
      body,
      data,
    }));

  if (messages.length === 0) return;

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const todayIsWeekend = today.getDay() === 0 || today.getDay() === 6;

    // 14 days ago for baseline window
    const baselineStart = new Date(today);
    baselineStart.setDate(baselineStart.getDate() - 14);
    const baselineStartStr = baselineStart.toISOString().split("T")[0];

    // Get all parent users
    const { data: parents, error: parentsError } = await supabase
      .from("users")
      .select("id, name, family_id, checkin_time")
      .eq("role", "parent");

    if (parentsError || !parents) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch parents", details: parentsError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let totalAnomalies = 0;

    for (const parent of parents) {
      // Get today's metrics
      const { data: todayMetrics } = await supabase
        .from("daily_metrics")
        .select("*")
        .eq("user_id", parent.id)
        .eq("date", todayStr)
        .single();

      if (!todayMetrics) continue; // no data today, skip

      // Get past 14 days of metrics for baseline
      const { data: history } = await supabase
        .from("daily_metrics")
        .select("steps, active_hours, checkin_time, mood, date")
        .eq("user_id", parent.id)
        .gte("date", baselineStartStr)
        .lt("date", todayStr)
        .order("date", { ascending: true });

      if (!history || history.length < 14) continue; // learning period

      // Split into weekend/weekday baselines
      const relevantHistory = (history as MetricRow[]).filter((row) =>
        todayIsWeekend ? isWeekend(row.date) : !isWeekend(row.date),
      );

      if (relevantHistory.length < 5) continue; // not enough same-type days

      const anomalies: {
        type: AnomalyType;
        severity: Severity;
        metric_value: number;
        baseline_value: number;
        deviation: number;
      }[] = [];

      // --- Check steps ---
      const stepsValues = relevantHistory
        .map((r) => r.steps)
        .filter((v): v is number => v !== null);
      const stepsBaseline = computeBaseline(stepsValues);
      if (stepsBaseline && todayMetrics.steps !== null) {
        const dev = (stepsBaseline.avg - todayMetrics.steps) / stepsBaseline.stddev;
        if (dev > 2.0) {
          anomalies.push({
            type: "steps_low",
            severity: "alert",
            metric_value: todayMetrics.steps,
            baseline_value: stepsBaseline.avg,
            deviation: dev,
          });
        } else if (dev > 1.5) {
          anomalies.push({
            type: "steps_low",
            severity: "watch",
            metric_value: todayMetrics.steps,
            baseline_value: stepsBaseline.avg,
            deviation: dev,
          });
        }
      }

      // --- Check active hours ---
      const activeValues = relevantHistory
        .map((r) => r.active_hours)
        .filter((v): v is number => v !== null);
      const activeBaseline = computeBaseline(activeValues);
      if (activeBaseline && todayMetrics.active_hours !== null) {
        const dev =
          (activeBaseline.avg - todayMetrics.active_hours) / activeBaseline.stddev;
        if (dev > 2.0) {
          anomalies.push({
            type: "inactive",
            severity: "alert",
            metric_value: todayMetrics.active_hours,
            baseline_value: activeBaseline.avg,
            deviation: dev,
          });
        } else if (dev > 1.5) {
          anomalies.push({
            type: "inactive",
            severity: "watch",
            metric_value: todayMetrics.active_hours,
            baseline_value: activeBaseline.avg,
            deviation: dev,
          });
        }
      }

      // --- Check checkin delay ---
      const checkinValues = relevantHistory
        .map((r) => checkinTimeToMinutes(r.checkin_time))
        .filter((v): v is number => v !== null);
      const checkinBaseline = computeBaseline(checkinValues);
      const todayCheckinMin = checkinTimeToMinutes(todayMetrics.checkin_time);
      if (checkinBaseline && todayCheckinMin !== null) {
        // Later checkin = higher minutes = positive deviation
        const dev =
          (todayCheckinMin - checkinBaseline.avg) / checkinBaseline.stddev;
        if (dev > 2.0) {
          anomalies.push({
            type: "late_checkin",
            severity: "alert",
            metric_value: todayCheckinMin,
            baseline_value: checkinBaseline.avg,
            deviation: dev,
          });
        } else if (dev > 1.5) {
          anomalies.push({
            type: "late_checkin",
            severity: "watch",
            metric_value: todayCheckinMin,
            baseline_value: checkinBaseline.avg,
            deviation: dev,
          });
        }
      }

      // --- Check mood decline ---
      const moodValues = relevantHistory
        .map((r) => (r.mood ? MOOD_SCORE[r.mood] ?? null : null))
        .filter((v): v is number => v !== null);
      const moodBaseline = computeBaseline(moodValues);
      const todayMoodScore = todayMetrics.mood
        ? MOOD_SCORE[todayMetrics.mood] ?? null
        : null;
      if (moodBaseline && todayMoodScore !== null) {
        const dev = (moodBaseline.avg - todayMoodScore) / moodBaseline.stddev;
        if (dev > 2.0) {
          anomalies.push({
            type: "mood_decline",
            severity: "alert",
            metric_value: todayMoodScore,
            baseline_value: moodBaseline.avg,
            deviation: dev,
          });
        } else if (dev > 1.5) {
          anomalies.push({
            type: "mood_decline",
            severity: "watch",
            metric_value: todayMoodScore,
            baseline_value: moodBaseline.avg,
            deviation: dev,
          });
        }
      }

      // Insert anomaly records
      if (anomalies.length > 0) {
        const rows = anomalies.map((a) => ({
          user_id: parent.id,
          date: todayStr,
          type: a.type,
          severity: a.severity,
          metric_value: a.metric_value,
          baseline_value: a.baseline_value,
          deviation: a.deviation,
          notified: a.severity === "alert",
        }));

        await supabase.from("anomalies").insert(rows);
        totalAnomalies += rows.length;

        // Push alerts for severity = 'alert' to all family members
        const alertAnomalies = anomalies.filter((a) => a.severity === "alert");
        if (alertAnomalies.length > 0) {
          const { data: familyMembers } = await supabase
            .from("users")
            .select("push_token, name")
            .eq("family_id", parent.family_id)
            .neq("id", parent.id);

          if (familyMembers) {
            const tokens = familyMembers
              .map((m) => m.push_token)
              .filter(Boolean) as string[];

            const typeLabels: Record<AnomalyType, string> = {
              steps_low: "unusually low steps",
              inactive: "reduced activity",
              late_checkin: "late check-in",
              mood_decline: "mood change",
            };

            const alertDescriptions = alertAnomalies
              .map((a) => typeLabels[a.type])
              .join(", ");

            await sendExpoPush(
              tokens,
              `Health Alert for ${parent.name}`,
              `We noticed ${alertDescriptions} today. You may want to check in.`,
              {
                type: "anomaly_alert",
                user_id: parent.id,
                anomaly_types: alertAnomalies.map((a) => a.type),
              },
            );
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        parents_checked: parents.length,
        anomalies_created: totalAnomalies,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
