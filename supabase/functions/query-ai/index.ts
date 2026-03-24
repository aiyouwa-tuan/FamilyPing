import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =============================================================================
// FamilyPing V2.5 - Query AI Edge Function
// =============================================================================
// POST handler for conversational AI queries from family members.
// Receives a natural language question, collects relevant context (14 days of
// metrics, checkins, insights, anomalies), and returns an AI-generated answer.
// Auth: must be a family role user.
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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseUser.auth.getUser();

    if (authError || !authUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client for data collection
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify the user is a family member
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, name, family_id, role")
      .eq("id", authUser.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile.role !== "family") {
      return new Response(JSON.stringify({ error: "Only family members can query AI" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await req.json();
    const { question } = body;

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Question is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Collect context: all parent members in the family
    const { data: parents } = await supabase
      .from("users")
      .select("id, name")
      .eq("family_id", profile.family_id)
      .eq("role", "parent");

    const parentIds = (parents ?? []).map((p) => p.id);
    const parentNames = (parents ?? []).map((p) => p.name);

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const twoWeeksAgoStr = twoWeeksAgo.toISOString().split("T")[0];

    // 14 days of metrics
    const { data: metrics } = await supabase
      .from("daily_metrics")
      .select("user_id, date, steps, active_hours, sleep_minutes, mood")
      .in("user_id", parentIds)
      .gte("date", twoWeeksAgoStr)
      .lte("date", todayStr)
      .order("date", { ascending: true });

    // 14 days of checkins
    const { data: checkins } = await supabase
      .from("checkins")
      .select("user_id, mood, checked_in_at, checkin_delay_minutes, question_answer")
      .in("user_id", parentIds)
      .gte("checked_in_at", twoWeeksAgoStr)
      .order("checked_in_at", { ascending: true });

    // Recent daily insights
    const { data: insights } = await supabase
      .from("daily_insights")
      .select("user_id, date, status, summary, insights, suggestion, weather_alert")
      .in("user_id", parentIds)
      .gte("date", twoWeeksAgoStr)
      .lte("date", todayStr)
      .order("date", { ascending: true });

    // Recent anomalies
    const { data: anomalies } = await supabase
      .from("anomalies")
      .select("user_id, date, type, severity, metric_value, baseline_value")
      .in("user_id", parentIds)
      .gte("date", twoWeeksAgoStr)
      .lte("date", todayStr)
      .order("date", { ascending: true });

    // Build parent name mapping
    const nameMap: Record<string, string> = {};
    for (const p of parents ?? []) {
      nameMap[p.id] = p.name;
    }

    // Tag data with parent names for context
    const taggedMetrics = (metrics ?? []).map((m) => ({ ...m, parent_name: nameMap[m.user_id] }));
    const taggedCheckins = (checkins ?? []).map((c) => ({
      parent_name: nameMap[c.user_id],
      mood: c.mood,
      time: c.checked_in_at,
      delay: c.checkin_delay_minutes,
      note: c.question_answer,
    }));
    const taggedInsights = (insights ?? []).map((i) => ({
      parent_name: nameMap[i.user_id],
      date: i.date,
      status: i.status,
      summary: i.summary,
    }));
    const taggedAnomalies = (anomalies ?? []).map((a) => ({
      parent_name: nameMap[a.user_id],
      date: a.date,
      type: a.type,
      severity: a.severity,
      value: a.metric_value,
      baseline: a.baseline_value,
    }));

    const dataContext = {
      family_parents: parentNames,
      period: `${twoWeeksAgoStr} to ${todayStr}`,
      metrics: taggedMetrics,
      checkins: taggedCheckins,
      daily_insights: taggedInsights,
      anomalies: taggedAnomalies,
    };

    const systemPrompt = `You are the FamilyPing AI assistant. You help family members understand how their elderly parents are doing. You have access to health metrics, check-in data, daily insights, and anomaly records. Be warm, informative, and concise. Always answer based on the provided data — never make up information.

Return your response as a JSON object with this structure:
{
  "answer": "your conversational answer here",
  "data_points": [{"label": "description", "value": "value"}, ...]
}

The data_points array should include 2-5 relevant data points that support your answer.`;

    const userPrompt = `The family member "${profile.name}" asks: "${question}"

Here is the last 14 days of data for their family:
${JSON.stringify(dataContext, null, 2)}

Answer their question based on this data. Be specific with numbers and dates when relevant.`;

    let answer: string;
    let dataPoints: any[];

    try {
      const raw = await callDeepSeek([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ]);

      const parsed = JSON.parse(raw);
      answer = parsed.answer ?? "I couldn't generate an answer. Please try rephrasing your question.";
      dataPoints = Array.isArray(parsed.data_points) ? parsed.data_points : [];
    } catch (aiError) {
      console.error(`[QueryAI] DeepSeek error: ${aiError}`);
      answer = "I'm having trouble analyzing the data right now. Please try again in a moment.";
      dataPoints = [];
    }

    return new Response(
      JSON.stringify({ answer, data_points: dataPoints }),
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
