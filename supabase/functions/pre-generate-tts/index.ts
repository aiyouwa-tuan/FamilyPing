import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization" }, 401);
    }

    // Service role client for admin operations (pg_cron uses service role)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const FISH_API_KEY = Deno.env.get("FISH_AUDIO_API_KEY");
    if (!FISH_API_KEY) {
      return jsonResponse({ error: "Fish Audio API key not configured" }, 500);
    }

    // Get tomorrow's date info
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split("T")[0];
    const dayOfWeek = DAY_NAMES[tomorrow.getDay()];

    // Get all families with active (ready) voice profiles
    const { data: voiceProfiles, error: vpErr } = await supabase
      .from("voice_profiles")
      .select("*, families:family_id(id, name)")
      .eq("status", "ready")
      .eq("is_primary", true);

    if (vpErr) {
      return jsonResponse({ error: "Failed to fetch voice profiles", details: vpErr.message }, 500);
    }

    if (!voiceProfiles || voiceProfiles.length === 0) {
      return jsonResponse({
        success: true,
        message: "No active primary voice profiles found",
        stats: { families_processed: 0, total_characters: 0, total_cost: 0, failures: 0 },
      });
    }

    const stats = {
      families_processed: 0,
      total_characters: 0,
      total_cost: 0,
      failures: 0,
      failure_details: [] as string[],
    };

    for (const vp of voiceProfiles) {
      const familyId = vp.family_id;
      stats.families_processed++;

      try {
        // Get the parent user for this family
        const { data: parentUser } = await supabase
          .from("users")
          .select("name")
          .eq("family_id", familyId)
          .eq("role", "parent")
          .limit(1)
          .single();

        const parentName = parentUser?.name || "there";

        // ── 1. Generate morning greeting ──────────────────────────────
        // Try to get weather data (fallback to generic greeting)
        let weatherText = "sunny and pleasant";
        let tempText = "72";
        try {
          // Use a default location or family location if available
          const apiKey = Deno.env.get("OPENWEATHER_API_KEY");
          if (apiKey) {
            const weatherRes = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?q=New+York&units=imperial&appid=${apiKey}`,
            );
            if (weatherRes.ok) {
              const weatherData = await weatherRes.json();
              tempText = String(Math.round(weatherData.main.temp));
              weatherText = weatherData.weather[0].description;
            }
          }
        } catch {
          // Use fallback weather text
        }

        const greetingText =
          `Good morning ${parentName}, it's ${dayOfWeek}. The weather today is ${tempText} degrees Fahrenheit with ${weatherText}. Have a wonderful day!`;

        const greetingResult = await generateAndUploadTTS(
          supabase,
          FISH_API_KEY,
          vp.provider_voice_id,
          greetingText,
          `tts-cache/${familyId}/${tomorrowDate}/morning-greeting.mp3`,
        );

        if (greetingResult.success) {
          stats.total_characters += greetingResult.characterCount;
          stats.total_cost += greetingResult.cost;
        } else {
          stats.failures++;
          stats.failure_details.push(
            `Family ${familyId}: morning greeting failed - ${greetingResult.error}`,
          );
        }

        // ── 2. Generate TTS for featured content items ────────────────
        const { data: featuredContent } = await supabase
          .from("content_items")
          .select("id, text_content")
          .eq("family_id", familyId)
          .eq("featured_date", tomorrowDate)
          .eq("is_featured", true);

        if (featuredContent && featuredContent.length > 0) {
          for (const content of featuredContent) {
            if (!content.text_content) continue;

            const contentResult = await generateAndUploadTTS(
              supabase,
              FISH_API_KEY,
              vp.provider_voice_id,
              content.text_content,
              `tts-cache/${familyId}/${tomorrowDate}/content-${content.id}.mp3`,
            );

            if (contentResult.success) {
              stats.total_characters += contentResult.characterCount;
              stats.total_cost += contentResult.cost;
            } else {
              stats.failures++;
              stats.failure_details.push(
                `Family ${familyId}: content ${content.id} failed - ${contentResult.error}`,
              );
            }
          }
        }
      } catch (err) {
        stats.failures++;
        stats.failure_details.push(
          `Family ${familyId}: unexpected error - ${String(err)}`,
        );
      }
    }

    // Send notification to family members if there were failures
    if (stats.failures > 0) {
      for (const vp of voiceProfiles) {
        const relevantFailures = stats.failure_details.filter((d) =>
          d.includes(vp.family_id),
        );
        if (relevantFailures.length === 0) continue;

        const { data: familyMembers } = await supabase
          .from("users")
          .select("push_token")
          .eq("family_id", vp.family_id)
          .eq("role", "family");

        if (familyMembers) {
          const tokens = familyMembers
            .map((m: { push_token: string | null }) => m.push_token)
            .filter(Boolean) as string[];

          if (tokens.length > 0) {
            await sendExpoPush(
              tokens,
              "Voice Generation Issue",
              "Some voice content couldn't be generated for tomorrow. Please check the voice setup.",
            );
          }
        }
      }
    }

    // Log generation stats
    await supabase.from("tts_generation_logs").insert({
      run_date: tomorrowDate,
      families_processed: stats.families_processed,
      total_characters: stats.total_characters,
      estimated_cost: stats.total_cost,
      failures: stats.failures,
      failure_details: stats.failure_details,
    });

    return jsonResponse({
      success: true,
      stats: {
        families_processed: stats.families_processed,
        total_characters: stats.total_characters,
        total_cost: stats.total_cost,
        failures: stats.failures,
      },
    });
  } catch (err) {
    return jsonResponse(
      { error: "Internal server error", details: String(err) },
      500,
    );
  }
});

// ─── Helper: Generate TTS and upload to Storage ──────────────────────────────

async function generateAndUploadTTS(
  supabase: ReturnType<typeof createClient>,
  apiKey: string,
  referenceId: string,
  text: string,
  storagePath: string,
): Promise<{
  success: boolean;
  characterCount: number;
  cost: number;
  error?: string;
}> {
  try {
    const fishRes = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        reference_id: referenceId,
        format: "mp3",
      }),
    });

    if (!fishRes.ok) {
      const errBody = await fishRes.text();
      return {
        success: false,
        characterCount: text.length,
        cost: 0,
        error: `Fish Audio TTS error: ${fishRes.status} - ${errBody}`,
      };
    }

    const audioBuffer = await fishRes.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);

    const { error: uploadErr } = await supabase.storage
      .from("audio")
      .upload(storagePath, audioBytes, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadErr) {
      return {
        success: false,
        characterCount: text.length,
        cost: 0,
        error: `Storage upload failed: ${uploadErr.message}`,
      };
    }

    const characterCount = text.length;
    const cost = characterCount * 0.00001;

    return { success: true, characterCount, cost };
  } catch (err) {
    return {
      success: false,
      characterCount: text.length,
      cost: 0,
      error: String(err),
    };
  }
}

// ─── Helper: Send Expo push notifications ────────────────────────────────────

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
