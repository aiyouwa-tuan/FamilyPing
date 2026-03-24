import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =============================================================================
// FamilyPing V3.0 - Post-Call Processing
// =============================================================================
// Called after voice-orchestrator ends a call. Analyzes the full transcript
// via DeepSeek to generate summary, key topics, mood score, and highlights.
// Updates voice_calls record and upserts conversation_memory topics.
// Sends push notification to all family members with call summary.
// =============================================================================

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface PostCallRequest {
  user_id: string;
  call_sid: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  transcript: string;
  turns: { role: string; content: string; timestamp: number }[];
}

interface CallAnalysis {
  summary: string;
  key_topics: { topic: string; sentiment: string; context: string }[];
  mood_score: number;
  highlights: { timestamp: string; text: string; importance: string }[];
}

async function callDeepSeek(messages: DeepSeekMessage[]): Promise<string> {
  const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY not set");

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      max_tokens: 1024,
      temperature: 0.4,
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

export async function processPostCall(req: PostCallRequest) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("name, family_id")
    .eq("id", req.user_id)
    .single();

  const userName = profile?.name ?? "your loved one";

  // ============ Analyze transcript with DeepSeek ============

  const systemPrompt = `You are the AI brain of FamilyPing, analyzing a phone conversation transcript between an AI companion and an elderly parent. Extract structured insights from the conversation. Be warm and accurate.`;

  const userPrompt = `Analyze this phone call transcript and return a JSON object with this exact structure:
{
  "summary": "2-3 sentence warm summary of the call",
  "key_topics": [
    {"topic": "topic name", "sentiment": "positive|neutral|negative|mixed", "context": "brief context about this topic"}
  ],
  "mood_score": 7,
  "highlights": [
    {"timestamp": "early|middle|late", "text": "notable quote or moment", "importance": "high|medium|low"}
  ]
}

Rules:
- summary: Warm, informative, 2-3 sentences. Focus on what matters to family members.
- key_topics: Extract 2-6 distinct topics discussed (e.g., health, meals, activities, family, feelings).
- mood_score: 1-10 based on overall emotional tone (1=very low, 5=neutral, 10=very positive).
- highlights: 1-4 notable moments. Use approximate timestamp positions.
- Keep sentiment accurate but compassionate.

Transcript:
${req.transcript}

Call duration: ${req.duration_seconds} seconds`;

  let analysis: CallAnalysis;

  try {
    const raw = await callDeepSeek([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    const parsed = JSON.parse(raw);
    analysis = {
      summary: parsed.summary ?? "Call completed successfully.",
      key_topics: Array.isArray(parsed.key_topics) ? parsed.key_topics : [],
      mood_score:
        typeof parsed.mood_score === "number"
          ? Math.max(1, Math.min(10, Math.round(parsed.mood_score)))
          : 5,
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
    };
  } catch (aiError) {
    console.error("[PostCall] DeepSeek analysis failed, using fallback:", aiError);
    analysis = {
      summary: `${userName} had a ${Math.round(req.duration_seconds / 60)}-minute check-in call.`,
      key_topics: [],
      mood_score: 5,
      highlights: [],
    };
  }

  // ============ Update voice_calls record ============

  const { error: updateError } = await supabase
    .from("voice_calls")
    .update({
      ended_at: req.ended_at,
      duration_seconds: req.duration_seconds,
      transcript: req.transcript,
      summary: analysis.summary,
      mood_score: analysis.mood_score,
      key_topics: analysis.key_topics,
      highlights: analysis.highlights,
    })
    .eq("user_id", req.user_id)
    .gte("started_at", req.started_at)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1);

  if (updateError) {
    console.error("[PostCall] Failed to update voice_calls:", updateError.message);
  }

  // ============ Upsert conversation_memory ============

  for (const topic of analysis.key_topics) {
    // Check if topic already exists for this user
    const { data: existing } = await supabase
      .from("conversation_memory")
      .select("id, mention_count")
      .eq("user_id", req.user_id)
      .eq("topic", topic.topic)
      .limit(1);

    if (existing && existing.length > 0) {
      // Update existing memory: increment mention_count, update last_mentioned_at
      await supabase
        .from("conversation_memory")
        .update({
          sentiment: topic.sentiment,
          context: topic.context,
          mention_count: existing[0].mention_count + 1,
          last_mentioned_at: new Date().toISOString(),
        })
        .eq("id", existing[0].id);
    } else {
      // Insert new memory topic
      await supabase.from("conversation_memory").insert({
        user_id: req.user_id,
        topic: topic.topic,
        sentiment: topic.sentiment,
        context: topic.context,
        mention_count: 1,
        first_mentioned_at: new Date().toISOString(),
        last_mentioned_at: new Date().toISOString(),
      });
    }
  }

  // ============ Push notification to family members ============

  if (profile?.family_id) {
    const { data: familyMembers } = await supabase
      .from("users")
      .select("push_token, name")
      .eq("family_id", profile.family_id);

    if (familyMembers) {
      const tokens = familyMembers
        .map((m) => m.push_token)
        .filter(Boolean) as string[];

      const moodEmoji =
        analysis.mood_score >= 7
          ? "😊"
          : analysis.mood_score >= 4
            ? "🙂"
            : "😔";

      const pushBody =
        analysis.summary.length > 180
          ? analysis.summary.substring(0, 177) + "..."
          : analysis.summary;

      await sendExpoPush(
        tokens,
        `${moodEmoji} Call with ${userName} complete`,
        pushBody,
        {
          type: "voice_call_summary",
          user_id: req.user_id,
          mood_score: analysis.mood_score,
        },
      );
    }
  }

  return {
    success: true,
    summary: analysis.summary,
    mood_score: analysis.mood_score,
    topics_count: analysis.key_topics.length,
    highlights_count: analysis.highlights.length,
  };
}

// Edge function entry point (called by voice-orchestrator)
if (import.meta.main) {
  const { serve } = await import("https://deno.land/std@0.177.0/http/server.ts");

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

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
      const body: PostCallRequest = await req.json();

      if (!body.user_id || !body.transcript) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: user_id, transcript" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const result = await processPostCall(body);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("[PostCall] Error:", err);
      return new Response(
        JSON.stringify({ error: "Internal server error", details: String(err) }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  });
}
