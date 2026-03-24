import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =============================================================================
// FamilyPing V2.5 - Daily Insight Edge Function
// =============================================================================
// Designed to run via pg_cron daily at 22:00.
// For each parent user, collects today's checkin, metrics, question answer,
// anomalies, 7-day trends, and weather forecast. Sends to DeepSeek API for
// structured analysis. Stores in daily_insights and pushes to family members.
// =============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const OPENWEATHER_API_URL = "https://api.openweathermap.org/data/2.5/forecast";

interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface InsightResult {
  status: "good" | "watch" | "concern";
  summary: string;
  insights: string[];
  suggestion: { action: string; reason: string; priority: string };
  weather_alert: string | null;
}

async function callDeepSeek(messages: DeepSeekMessage[]): Promise<string> {
  const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY not set");
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      max_tokens: 768,
      temperature: 0.6,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "{}";
}

async function fetchTomorrowForecast(
  lat: number,
  lon: number,
): Promise<{ tomorrow_high: number; tomorrow_low: number; today_high: number } | null> {
  const apiKey = Deno.env.get("OPENWEATHER_API_KEY");
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `${OPENWEATHER_API_URL}?lat=${lat}&lon=${lon}&units=imperial&cnt=16&appid=${apiKey}`,
    );
    if (!res.ok) return null;

    const data = await res.json();
    const forecasts = data.list ?? [];
    if (forecasts.length === 0) return null;

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    let todayHigh = -Infinity;
    let tomorrowHigh = -Infinity;
    let tomorrowLow = Infinity;

    for (const f of forecasts) {
      const dt = f.dt_txt?.split(" ")[0];
      const temp = f.main?.temp ?? 0;
      if (dt === todayStr) {
        todayHigh = Math.max(todayHigh, temp);
      }
      if (dt === tomorrowStr) {
        tomorrowHigh = Math.max(tomorrowHigh, temp);
        tomorrowLow = Math.min(tomorrowLow, temp);
      }
    }

    if (tomorrowHigh === -Infinity) return null;

    return {
      tomorrow_high: Math.round(tomorrowHigh),
      tomorrow_low: Math.round(tomorrowLow === Infinity ? tomorrowHigh : tomorrowLow),
      today_high: Math.round(todayHigh === -Infinity ? tomorrowHigh : todayHigh),
    };
  } catch {
    return null;
  }
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

    // 7-day trend window
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];

    // Get all parent users
    const { data: parents, error: parentsError } = await supabase
      .from("users")
      .select("id, name, family_id, timezone")
      .eq("role", "parent");

    if (parentsError || !parents) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch parents", details: parentsError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let insightsCreated = 0;

    for (const parent of parents) {
      // 1. Today's checkin
      const { data: todayCheckins } = await supabase
        .from("checkins")
        .select("mood, checked_in_at, checkin_delay_minutes, question_id, question_answer")
        .eq("user_id", parent.id)
        .gte("checked_in_at", todayStr)
        .order("checked_in_at", { ascending: false })
        .limit(1);

      // 2. Today's metrics
      const { data: todayMetrics } = await supabase
        .from("daily_metrics")
        .select("steps, active_hours, sleep_minutes, mood")
        .eq("user_id", parent.id)
        .eq("date", todayStr)
        .limit(1);

      // 3. 7-day trends (metrics)
      const { data: weekMetrics } = await supabase
        .from("daily_metrics")
        .select("date, steps, active_hours, sleep_minutes, mood")
        .eq("user_id", parent.id)
        .gte("date", weekAgoStr)
        .lte("date", todayStr)
        .order("date", { ascending: true });

      // 4. 7-day checkins (for trend)
      const { data: weekCheckins } = await supabase
        .from("checkins")
        .select("mood, checked_in_at, checkin_delay_minutes, question_answer")
        .eq("user_id", parent.id)
        .gte("checked_in_at", weekAgoStr)
        .order("checked_in_at", { ascending: true });

      // 5. Recent anomalies
      const { data: anomalies } = await supabase
        .from("anomalies")
        .select("date, type, severity, metric_value, baseline_value")
        .eq("user_id", parent.id)
        .gte("date", weekAgoStr)
        .lte("date", todayStr)
        .order("date", { ascending: true });

      // 6. Weather forecast check
      // Use a default lat/lon or fetch from user profile if available
      const forecast = await fetchTomorrowForecast(40.7128, -74.006); // TODO: use user's location
      let weatherAlertHint: string | null = null;
      if (forecast) {
        const tempDrop = forecast.today_high - forecast.tomorrow_low;
        if (tempDrop > 15) {
          weatherAlertHint = `Temperature dropping ${Math.round(tempDrop)}°F overnight (today ${forecast.today_high}°F -> tomorrow low ${forecast.tomorrow_low}°F). Remind ${parent.name} to dress warmly.`;
        }
      }

      // Build context for AI
      const context = {
        parent_name: parent.name,
        date: todayStr,
        today_checkin: todayCheckins?.[0] ?? null,
        today_metrics: todayMetrics?.[0] ?? null,
        seven_day_metrics: weekMetrics ?? [],
        seven_day_checkins: (weekCheckins ?? []).map((c) => ({
          mood: c.mood,
          time: c.checked_in_at,
          delay: c.checkin_delay_minutes,
          note: c.question_answer,
        })),
        anomalies: (anomalies ?? []).map((a) => ({
          date: a.date,
          type: a.type,
          severity: a.severity,
          value: a.metric_value,
          baseline: a.baseline_value,
        })),
        weather_alert_hint: weatherAlertHint,
      };

      const systemPrompt = `You are the AI brain of FamilyPing, a family wellness app for monitoring elderly parents. You analyze daily health data and produce structured JSON insights. Be warm, caring, and actionable. Never be alarmist — focus on practical suggestions.`;

      const userPrompt = `Analyze today's data for ${parent.name} and return a JSON object with this exact structure:
{
  "status": "good" | "watch" | "concern",
  "summary": "1-2 sentence warm summary of today",
  "insights": ["insight 1", "insight 2", ...],
  "suggestion": {
    "action": "specific action to take",
    "reason": "why this matters",
    "priority": "low" | "medium" | "high"
  },
  "weather_alert": "weather warning or null"
}

Rules for status:
- "good": Normal day, no concerns
- "watch": Minor deviations (e.g., slightly fewer steps, late checkin)
- "concern": Multiple anomalies, missed checkin, or declining trend

Data:
${JSON.stringify(context, null, 2)}

Guidelines:
- If no checkin today, that's a concern
- Compare today's metrics to the 7-day trend
- If there are anomalies, factor them into the status
- Include the weather alert if provided in weather_alert_hint
- Keep insights concise (max 4 items)
- Suggestion should be practical and specific`;

      let insight: InsightResult;

      try {
        const raw = await callDeepSeek([
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ]);

        const parsed = JSON.parse(raw);
        insight = {
          status: ["good", "watch", "concern"].includes(parsed.status) ? parsed.status : "good",
          summary: parsed.summary ?? "Daily insight unavailable.",
          insights: Array.isArray(parsed.insights) ? parsed.insights : [],
          suggestion: parsed.suggestion ?? { action: "Check in with your loved one", reason: "Stay connected", priority: "low" },
          weather_alert: parsed.weather_alert ?? weatherAlertHint ?? null,
        };
      } catch (aiError) {
        // Fallback: generate a basic insight without AI
        const checkedIn = todayCheckins && todayCheckins.length > 0;
        const mood = todayCheckins?.[0]?.mood ?? "unknown";
        const steps = todayMetrics?.[0]?.steps ?? null;
        const anomalyCount = anomalies?.length ?? 0;

        insight = {
          status: !checkedIn ? "concern" : anomalyCount > 0 ? "watch" : "good",
          summary: checkedIn
            ? `${parent.name} checked in today feeling ${mood}${steps ? ` with ${steps} steps` : ""}.`
            : `${parent.name} hasn't checked in today.`,
          insights: [
            checkedIn ? `Checked in with mood: ${mood}` : "No check-in recorded today",
            ...(anomalyCount > 0 ? [`${anomalyCount} anomaly(s) detected this week`] : []),
          ],
          suggestion: {
            action: checkedIn ? "Send a quick message to stay connected" : "Give a call to check on them",
            reason: checkedIn ? "Regular connection strengthens bonds" : "Missing check-in may need follow-up",
            priority: checkedIn ? "low" : "high",
          },
          weather_alert: weatherAlertHint,
        };
        console.error(`[DailyInsight] DeepSeek fallback for ${parent.name}: ${aiError}`);
      }

      // Upsert daily insight
      const { error: upsertError } = await supabase
        .from("daily_insights")
        .upsert(
          {
            user_id: parent.id,
            date: todayStr,
            status: insight.status,
            summary: insight.summary,
            insights: insight.insights,
            suggestion: insight.suggestion,
            weather_alert: insight.weather_alert,
          },
          { onConflict: "user_id,date" },
        );

      if (upsertError) {
        console.error(`[DailyInsight] Failed to store insight for ${parent.name}: ${upsertError.message}`);
        continue;
      }

      insightsCreated++;

      // Push insight to all family members
      const { data: familyMembers } = await supabase
        .from("users")
        .select("push_token, name")
        .eq("family_id", parent.family_id);

      if (familyMembers) {
        const tokens = familyMembers
          .map((m) => m.push_token)
          .filter(Boolean) as string[];

        const statusEmoji =
          insight.status === "good" ? "✅" : insight.status === "watch" ? "👀" : "⚠️";

        const pushBody =
          insight.summary.length > 180
            ? insight.summary.substring(0, 177) + "..."
            : insight.summary;

        await sendExpoPush(
          tokens,
          `${statusEmoji} Daily Insight: ${parent.name}`,
          pushBody,
          {
            type: "daily_insight",
            user_id: parent.id,
            date: todayStr,
            status: insight.status,
          },
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        parents_processed: parents.length,
        insights_created: insightsCreated,
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
