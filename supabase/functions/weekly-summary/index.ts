import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =============================================================================
// FamilyPing V2.0 - Weekly Summary Edge Function
// =============================================================================
// Designed to run via pg_cron weekly (e.g., every Sunday at 20:00).
// For each parent user, collects the past 7 days of checkins, metrics, and
// anomalies, then calls DeepSeek API to generate a natural-language summary.
// Stores the summary and pushes it to all family members.
// =============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
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
      max_tokens: 512,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "Summary unavailable.";
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

    // Week start = 7 days ago
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    // Get all parent users
    const { data: parents, error: parentsError } = await supabase
      .from("users")
      .select("id, name, family_id")
      .eq("role", "parent");

    if (parentsError || !parents) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch parents", details: parentsError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let summariesCreated = 0;

    for (const parent of parents) {
      // Collect last 7 days of checkins
      const { data: checkins } = await supabase
        .from("checkins")
        .select("mood, checked_in_at, checkin_delay_minutes, question_answer")
        .eq("user_id", parent.id)
        .gte("checked_in_at", weekStartStr)
        .order("checked_in_at", { ascending: true });

      // Collect last 7 days of daily_metrics
      const { data: metrics } = await supabase
        .from("daily_metrics")
        .select("date, steps, active_hours, sleep_minutes, mood")
        .eq("user_id", parent.id)
        .gte("date", weekStartStr)
        .lte("date", todayStr)
        .order("date", { ascending: true });

      // Collect any anomalies from the past week
      const { data: anomalies } = await supabase
        .from("anomalies")
        .select("date, type, severity, metric_value, baseline_value")
        .eq("user_id", parent.id)
        .gte("date", weekStartStr)
        .lte("date", todayStr)
        .order("date", { ascending: true });

      // Build structured data for the AI prompt
      const weekData = {
        parent_name: parent.name,
        period: `${weekStartStr} to ${todayStr}`,
        checkins: (checkins ?? []).map((c) => ({
          mood: c.mood,
          time: c.checked_in_at,
          delay_minutes: c.checkin_delay_minutes,
          note: c.question_answer,
        })),
        metrics: metrics ?? [],
        anomalies: (anomalies ?? []).map((a) => ({
          date: a.date,
          type: a.type,
          severity: a.severity,
          value: a.metric_value,
          baseline: a.baseline_value,
        })),
      };

      const systemPrompt = `You are a caring family wellness assistant for FamilyPing. You analyze weekly health and activity data for elderly family members and write brief, warm summaries for their family. Be reassuring but honest. Focus on notable patterns and actionable suggestions.`;

      const userPrompt = `Summarize this week's data for ${parent.name} in 2-3 sentences. Note any trends (positive or concerning) and suggest one specific action the family could take.

Weekly Data:
${JSON.stringify(weekData, null, 2)}

Guidelines:
- Keep it warm and conversational, not clinical
- Mention specific numbers only when relevant (e.g., step trends)
- If there were anomalies, explain them in plain language
- If everything looks good, celebrate consistency
- End with one practical suggestion`;

      let summaryText: string;
      const highlights: { type: string; detail: string }[] = [];

      try {
        summaryText = await callDeepSeek([
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ]);
      } catch (aiError) {
        // Fallback: generate a basic summary without AI
        const checkinCount = checkins?.length ?? 0;
        const avgSteps = metrics?.length
          ? Math.round(
              metrics.reduce((s, m) => s + (m.steps ?? 0), 0) / metrics.length,
            )
          : 0;
        const anomalyCount = anomalies?.length ?? 0;

        summaryText = `${parent.name} checked in ${checkinCount} times this week with an average of ${avgSteps} daily steps. ${anomalyCount > 0 ? `There were ${anomalyCount} notable changes detected.` : "Everything looked steady."} Consider a quick call to say hi!`;
        console.error(`[WeeklySummary] DeepSeek fallback for ${parent.name}: ${aiError}`);
      }

      // Build highlights array
      if (anomalies && anomalies.length > 0) {
        for (const a of anomalies) {
          highlights.push({
            type: a.type,
            detail: `${a.severity}: ${a.metric_value} vs baseline ${a.baseline_value} on ${a.date}`,
          });
        }
      }

      // Upsert weekly summary
      const { error: upsertError } = await supabase
        .from("weekly_summaries")
        .upsert(
          {
            user_id: parent.id,
            week_start: weekStartStr,
            summary_text: summaryText,
            highlights,
          },
          { onConflict: "user_id,week_start" },
        );

      if (upsertError) {
        console.error(`[WeeklySummary] Failed to store summary for ${parent.name}: ${upsertError.message}`);
        continue;
      }

      summariesCreated++;

      // Push summary to all family members
      const { data: familyMembers } = await supabase
        .from("users")
        .select("push_token, name")
        .eq("family_id", parent.family_id);

      if (familyMembers) {
        const tokens = familyMembers
          .map((m) => m.push_token)
          .filter(Boolean) as string[];

        // Truncate for push notification (keep under 200 chars)
        const pushBody =
          summaryText.length > 180
            ? summaryText.substring(0, 177) + "..."
            : summaryText;

        await sendExpoPush(
          tokens,
          `Weekly Update: ${parent.name}`,
          pushBody,
          {
            type: "weekly_summary",
            user_id: parent.id,
            week_start: weekStartStr,
          },
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        parents_processed: parents.length,
        summaries_created: summariesCreated,
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
