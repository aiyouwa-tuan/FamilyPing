import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =============================================================================
// FamilyPing V3.0 - Voice Orchestrator Edge Function
// =============================================================================
// Main voice call orchestrator for Twilio Voice integration.
// Routes:
//   POST /start    - Initiates outbound call via Twilio REST API
//   POST /webhook  - Twilio webhook handler for call events
//   POST /stream   - Handles Twilio media stream for real-time audio
// =============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPGRAM_STT_URL = "wss://api.deepgram.com/v1/listen";
const MAX_CALL_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const GOODBYE_WARNING_MS = 4.5 * 60 * 1000; // 4:30 mark

interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface MemoryTopic {
  topic: string;
  sentiment: string | null;
  context: string;
  mention_count: number;
}

// In-memory store for active calls (per isolate)
const activeCalls = new Map<
  string,
  {
    userId: string;
    startedAt: number;
    turns: ConversationTurn[];
    memories: MemoryTopic[];
    callSid: string;
    warningIssued: boolean;
  }
>();

// ============ Twilio Helpers ============

function twilioAuthHeader(): string {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
  const token = Deno.env.get("TWILIO_AUTH_TOKEN")!;
  return `Basic ${btoa(`${sid}:${token}`)}`;
}

async function initiateOutboundCall(
  toPhone: string,
  webhookBaseUrl: string,
): Promise<{ callSid: string; status: string }> {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
  const fromPhone = Deno.env.get("TWILIO_PHONE_NUMBER")!;

  const twiml = generateGreetingTwiml(webhookBaseUrl);

  const params = new URLSearchParams({
    To: toPhone,
    From: fromPhone,
    Twiml: twiml,
    StatusCallback: `${webhookBaseUrl}/voice-orchestrator/webhook`,
    StatusCallbackEvent: "initiated ringing answered completed",
    Timeout: "30",
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`,
    {
      method: "POST",
      headers: {
        Authorization: twilioAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Twilio API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return { callSid: data.sid, status: data.status };
}

function generateGreetingTwiml(webhookBaseUrl: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Hi! This is your FamilyPing check-in call. How are you doing today?</Say>
  <Connect>
    <Stream url="wss://${new URL(webhookBaseUrl).host}/voice-orchestrator/stream" />
  </Connect>
</Response>`;
}

function generateResponseTwiml(text: string, webhookBaseUrl: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(text)}</Say>
  <Connect>
    <Stream url="wss://${new URL(webhookBaseUrl).host}/voice-orchestrator/stream" />
  </Connect>
</Response>`;
}

function generateGoodbyeTwiml(text: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(text)}</Say>
  <Hangup />
</Response>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ============ DeepSeek Conversation ============

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
      max_tokens: 256,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

function buildConversationSystemPrompt(
  userName: string,
  memories: MemoryTopic[],
): string {
  const memoryContext =
    memories.length > 0
      ? `\n\nYou remember these topics from past conversations:\n${memories
          .map(
            (m) =>
              `- ${m.topic} (mentioned ${m.mention_count} time(s), sentiment: ${m.sentiment ?? "neutral"}): ${m.context}`,
          )
          .join("\n")}`
      : "";

  return `You are a warm, caring AI companion calling ${userName} for their daily FamilyPing check-in. Your personality is like a kind neighbor or friend — warm, curious, and genuine.

Guidelines:
- Keep responses short and conversational (1-3 sentences), like a real phone call
- Ask follow-up questions about their day, health, activities, and feelings
- Reference past conversations naturally when relevant
- Be encouraging and positive, but don't be dismissive of concerns
- If they mention health issues, gently suggest seeing a doctor if appropriate
- Never give medical diagnoses or prescriptions
- Track the time: you have about 5 minutes total
- At the 4:30 mark, start wrapping up warmly${memoryContext}`;
}

async function getAIResponse(
  callSid: string,
  userTranscript: string,
): Promise<string> {
  const call = activeCalls.get(callSid);
  if (!call) return "I'm sorry, I seem to have lost our connection.";

  // Add user turn
  call.turns.push({
    role: "user",
    content: userTranscript,
    timestamp: Date.now(),
  });

  // Check time limit
  const elapsed = Date.now() - call.startedAt;
  const isNearEnd = elapsed >= GOODBYE_WARNING_MS;

  // Build messages for DeepSeek
  const messages: DeepSeekMessage[] = [
    {
      role: "system",
      content: buildConversationSystemPrompt("the caller", call.memories),
    },
  ];

  // Add conversation history
  for (const turn of call.turns) {
    messages.push({ role: turn.role, content: turn.content });
  }

  // Add time warning if needed
  if (isNearEnd && !call.warningIssued) {
    call.warningIssued = true;
    messages.push({
      role: "system",
      content:
        "The call is almost at 5 minutes. Wrap up the conversation warmly. Summarize what you discussed and say a caring goodbye.",
    });
  }

  const aiResponse = await callDeepSeek(messages);

  // Add assistant turn
  call.turns.push({
    role: "assistant",
    content: aiResponse,
    timestamp: Date.now(),
  });

  return aiResponse;
}

// ============ Deepgram STT ============

async function transcribeAudio(audioBuffer: Uint8Array): Promise<string> {
  const apiKey = Deno.env.get("DEEPGRAM_API_KEY");
  if (!apiKey) throw new Error("DEEPGRAM_API_KEY not set");

  const response = await fetch(
    "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "audio/mulaw",
      },
      body: audioBuffer,
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Deepgram API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return (
    data.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ""
  );
}

// ============ TTS ============

async function textToSpeech(text: string): Promise<Uint8Array> {
  const apiKey = Deno.env.get("TTS_API_KEY");

  // Try ElevenLabs first, fall back to a simple response
  if (apiKey) {
    try {
      const response = await fetch(
        "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        },
      );

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
      }
    } catch (e) {
      console.error("[VoiceOrchestrator] TTS error, falling back:", e);
    }
  }

  // Return empty audio as fallback (Twilio will use <Say> TwiML instead)
  return new Uint8Array(0);
}

// ============ Post-Call Processing ============

async function triggerPostCallProcessing(
  callSid: string,
  supabaseUrl: string,
  serviceRoleKey: string,
) {
  const call = activeCalls.get(callSid);
  if (!call) return;

  const transcript = call.turns
    .map(
      (t) =>
        `[${t.role === "user" ? "Parent" : "AI"}] ${t.content}`,
    )
    .join("\n");

  try {
    await fetch(`${supabaseUrl}/functions/v1/voice-orchestrator/post-call`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        user_id: call.userId,
        call_sid: callSid,
        started_at: new Date(call.startedAt).toISOString(),
        ended_at: new Date().toISOString(),
        duration_seconds: Math.round((Date.now() - call.startedAt) / 1000),
        transcript,
        turns: call.turns,
      }),
    });
  } catch (e) {
    console.error("[VoiceOrchestrator] Failed to trigger post-call:", e);
  }

  // Clean up
  activeCalls.delete(callSid);
}

// ============ Route Handler ============

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ====== POST /start - Initiate outbound call ======
    if (path === "start" && req.method === "POST") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Missing authorization" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
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

      // Get user profile with phone number
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ error: "User profile not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Load conversation memory for context
      const { data: memories } = await supabase
        .from("conversation_memory")
        .select("topic, sentiment, context, mention_count")
        .eq("user_id", authUser.id)
        .order("last_mentioned_at", { ascending: false })
        .limit(20);

      const webhookBaseUrl = Deno.env.get("SUPABASE_URL")!.replace(
        "/rest/v1",
        "",
      );

      // Initiate Twilio call
      const { callSid, status } = await initiateOutboundCall(
        profile.phone,
        `${Deno.env.get("SUPABASE_URL")!}/functions/v1`,
      );

      // Store active call state
      activeCalls.set(callSid, {
        userId: authUser.id,
        startedAt: Date.now(),
        turns: [],
        memories: (memories ?? []) as MemoryTopic[],
        callSid,
        warningIssued: false,
      });

      // Create initial voice_calls record
      await supabase.from("voice_calls").insert({
        user_id: authUser.id,
        started_at: new Date().toISOString(),
      });

      // Set auto-hangup timer (5 min max)
      setTimeout(async () => {
        if (activeCalls.has(callSid)) {
          const sid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
          await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls/${callSid}.json`,
            {
              method: "POST",
              headers: {
                Authorization: twilioAuthHeader(),
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                Twiml: generateGoodbyeTwiml(
                  "It was wonderful talking with you! Take care and have a great day. Bye!",
                ),
              }).toString(),
            },
          );

          await triggerPostCallProcessing(
            callSid,
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
          );
        }
      }, MAX_CALL_DURATION_MS);

      return new Response(
        JSON.stringify({
          success: true,
          call_sid: callSid,
          status,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ====== POST /webhook - Twilio status callback ======
    if (path === "webhook" && req.method === "POST") {
      const formData = await req.formData();
      const callSid = formData.get("CallSid") as string;
      const callStatus = formData.get("CallStatus") as string;
      const callDuration = formData.get("CallDuration") as string;

      console.log(
        `[VoiceOrchestrator] Webhook: ${callSid} status=${callStatus} duration=${callDuration}`,
      );

      if (callStatus === "completed" || callStatus === "failed" || callStatus === "no-answer") {
        // Trigger post-call processing
        await triggerPostCallProcessing(
          callSid,
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
      }

      // Return empty TwiML for Twilio
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "text/xml" },
        },
      );
    }

    // ====== POST /stream - Twilio media stream handler ======
    if (path === "stream" && req.method === "POST") {
      // Handle Twilio media stream events
      // In production, this would be a WebSocket upgrade for real-time audio
      const body = await req.json();
      const event = body.event;

      if (event === "media") {
        const callSid = body.streamSid;
        const payload = body.media?.payload;

        if (payload && callSid) {
          // Decode base64 audio from Twilio
          const audioBytes = Uint8Array.from(atob(payload), (c) =>
            c.charCodeAt(0),
          );

          // Transcribe with Deepgram
          const transcript = await transcribeAudio(audioBytes);

          if (transcript && transcript.trim().length > 0) {
            // Get AI response
            const aiResponse = await getAIResponse(callSid, transcript);

            // Generate TTS audio
            const ttsAudio = await textToSpeech(aiResponse);

            if (ttsAudio.length > 0) {
              // In production, stream audio back via WebSocket
              return new Response(
                JSON.stringify({
                  event: "media",
                  streamSid: callSid,
                  media: {
                    payload: btoa(
                      String.fromCharCode(...ttsAudio),
                    ),
                  },
                }),
                {
                  status: 200,
                  headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                  },
                },
              );
            }

            // Fallback: return TwiML with <Say>
            const call = activeCalls.get(callSid);
            const isEnding =
              call && Date.now() - call.startedAt >= GOODBYE_WARNING_MS;

            const twiml = isEnding
              ? generateGoodbyeTwiml(aiResponse)
              : generateResponseTwiml(
                  aiResponse,
                  `${Deno.env.get("SUPABASE_URL")!}/functions/v1`,
                );

            return new Response(twiml, {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "text/xml" },
            });
          }
        }
      }

      if (event === "stop") {
        const callSid = body.streamSid;
        if (callSid) {
          await triggerPostCallProcessing(
            callSid,
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
          );
        }
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[VoiceOrchestrator] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
