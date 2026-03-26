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

    // Client for auth-based user lookup
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
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Service role client for admin operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", authUser.id)
      .single();

    if (profileError || !profile) {
      return jsonResponse({ error: "User profile not found" }, 404);
    }

    const FISH_API_KEY = Deno.env.get("FISH_AUDIO_API_KEY");
    if (!FISH_API_KEY) {
      return jsonResponse({ error: "Fish Audio API key not configured" }, 500);
    }

    // Parse URL path to determine action
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    // Also support action in body for flexibility
    const body = await req.json();
    const resolvedAction = action === "voice-clone" ? body.action : action;

    switch (resolvedAction) {
      case "clone":
        return await handleClone(supabase, profile, body, FISH_API_KEY);
      case "synthesize":
        return await handleSynthesize(supabase, profile, body, FISH_API_KEY);
      case "delete":
        return await handleDelete(supabase, profile, body, FISH_API_KEY);
      default:
        return jsonResponse({ error: "Invalid action. Use: clone, synthesize, or delete" }, 400);
    }
  } catch (err) {
    return jsonResponse(
      { error: "Internal server error", details: String(err) },
      500,
    );
  }
});

// ─── Clone: Create a cloned voice model via Fish Audio ───────────────────────

async function handleClone(
  supabase: ReturnType<typeof createClient>,
  profile: { id: string; family_id: string },
  body: { audio_url: string; voice_name: string; voice_profile_id?: string },
  apiKey: string,
) {
  const { audio_url, voice_name, voice_profile_id } = body;

  if (!audio_url || !voice_name) {
    return jsonResponse({ error: "audio_url and voice_name are required" }, 400);
  }

  // Create or get voice profile record
  let profileId = voice_profile_id;
  if (!profileId) {
    const { data: vp, error: vpErr } = await supabase
      .from("voice_profiles")
      .insert({
        family_id: profile.family_id,
        created_by: profile.id,
        voice_name,
        audio_sample_url: audio_url,
        provider: "fish_audio",
        status: "processing",
      })
      .select()
      .single();

    if (vpErr || !vp) {
      return jsonResponse({ error: "Failed to create voice profile", details: vpErr?.message }, 500);
    }
    profileId = vp.id;
  } else {
    // Update existing profile to processing
    await supabase
      .from("voice_profiles")
      .update({ status: "processing", voice_name, audio_sample_url: audio_url })
      .eq("id", profileId);
  }

  try {
    // Download audio from Supabase Storage
    const audioRes = await fetch(audio_url);
    if (!audioRes.ok) {
      throw new Error(`Failed to download audio: ${audioRes.statusText}`);
    }
    const audioBlob = await audioRes.blob();

    // Send to Fish Audio API to create voice model
    const formData = new FormData();
    formData.append("voices", audioBlob, "voice_sample.wav");
    formData.append("title", voice_name);
    formData.append("visibility", "private");

    const fishRes = await fetch("https://api.fish.audio/model", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!fishRes.ok) {
      const errBody = await fishRes.text();
      throw new Error(`Fish Audio API error: ${fishRes.status} - ${errBody}`);
    }

    const fishData = await fishRes.json();
    const providerVoiceId = fishData._id || fishData.id;

    // Update voice profile with provider ID and ready status
    await supabase
      .from("voice_profiles")
      .update({
        provider_voice_id: providerVoiceId,
        status: "ready",
      })
      .eq("id", profileId);

    return jsonResponse({
      success: true,
      voice_profile_id: profileId,
      provider_voice_id: providerVoiceId,
    });
  } catch (err) {
    // Mark as failed
    await supabase
      .from("voice_profiles")
      .update({ status: "failed" })
      .eq("id", profileId);

    return jsonResponse(
      { success: false, voice_profile_id: profileId, error: String(err) },
      500,
    );
  }
}

// ─── Synthesize: TTS via Fish Audio ──────────────────────────────────────────

async function handleSynthesize(
  supabase: ReturnType<typeof createClient>,
  profile: { id: string; family_id: string },
  body: { text: string; voice_profile_id: string },
  apiKey: string,
) {
  const { text, voice_profile_id } = body;

  if (!text || !voice_profile_id) {
    return jsonResponse({ error: "text and voice_profile_id are required" }, 400);
  }

  // Get voice profile
  const { data: voiceProfile, error: vpErr } = await supabase
    .from("voice_profiles")
    .select("*")
    .eq("id", voice_profile_id)
    .eq("family_id", profile.family_id)
    .single();

  if (vpErr || !voiceProfile) {
    return jsonResponse({ error: "Voice profile not found" }, 404);
  }

  if (voiceProfile.status !== "ready") {
    return jsonResponse({ error: "Voice profile is not ready" }, 400);
  }

  // Check daily TTS usage limit (10,000 characters per day per family)
  const DAILY_CHAR_LIMIT = 10000;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: usageData } = await supabase
    .from("tts_usage")
    .select("character_count")
    .eq("family_id", profile.family_id)
    .gte("created_at", todayStart.toISOString());

  const todayUsage = (usageData || []).reduce(
    (sum: number, u: { character_count: number }) => sum + (u.character_count || 0),
    0,
  );

  if (todayUsage + text.length > DAILY_CHAR_LIMIT) {
    return jsonResponse(
      {
        error: "Daily TTS character limit exceeded",
        daily_limit: DAILY_CHAR_LIMIT,
        used: todayUsage,
        requested: text.length,
      },
      429,
    );
  }

  try {
    // Call Fish Audio TTS API
    const fishRes = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        reference_id: voiceProfile.provider_voice_id,
        format: "mp3",
      }),
    });

    if (!fishRes.ok) {
      const errBody = await fishRes.text();
      throw new Error(`Fish Audio TTS error: ${fishRes.status} - ${errBody}`);
    }

    const audioBuffer = await fishRes.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);

    // Upload generated audio to Supabase Storage
    const fileName = `tts/${profile.family_id}/${Date.now()}.mp3`;
    const { error: uploadErr } = await supabase.storage
      .from("audio")
      .upload(fileName, audioBytes, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadErr) {
      throw new Error(`Storage upload failed: ${uploadErr.message}`);
    }

    const { data: publicUrl } = supabase.storage
      .from("audio")
      .getPublicUrl(fileName);

    // Track usage
    const characterCount = text.length;
    const estimatedCost = characterCount * 0.00001; // rough estimate

    await supabase.from("tts_usage").insert({
      family_id: profile.family_id,
      user_id: profile.id,
      voice_profile_id,
      character_count: characterCount,
      estimated_cost: estimatedCost,
    });

    return jsonResponse({
      success: true,
      audio_url: publicUrl.publicUrl,
      character_count: characterCount,
      cost: estimatedCost,
    });
  } catch (err) {
    return jsonResponse(
      { success: false, error: String(err) },
      500,
    );
  }
}

// ─── Delete: Remove voice from Fish Audio and Supabase ───────────────────────

async function handleDelete(
  supabase: ReturnType<typeof createClient>,
  profile: { id: string; family_id: string },
  body: { voice_profile_id: string },
  apiKey: string,
) {
  const { voice_profile_id } = body;

  if (!voice_profile_id) {
    return jsonResponse({ error: "voice_profile_id is required" }, 400);
  }

  // Get voice profile
  const { data: voiceProfile, error: vpErr } = await supabase
    .from("voice_profiles")
    .select("*")
    .eq("id", voice_profile_id)
    .eq("family_id", profile.family_id)
    .single();

  if (vpErr || !voiceProfile) {
    return jsonResponse({ error: "Voice profile not found" }, 404);
  }

  try {
    // Delete from Fish Audio if provider_voice_id exists
    if (voiceProfile.provider_voice_id) {
      const fishRes = await fetch(
        `https://api.fish.audio/model/${voiceProfile.provider_voice_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      );

      // Log but don't fail if Fish Audio delete fails
      if (!fishRes.ok) {
        console.warn(
          `Fish Audio delete warning: ${fishRes.status} for model ${voiceProfile.provider_voice_id}`,
        );
      }
    }

    // Delete audio sample from Storage if exists
    if (voiceProfile.audio_sample_url) {
      const urlPath = new URL(voiceProfile.audio_sample_url).pathname;
      const storagePath = urlPath.split("/storage/v1/object/public/audio/")[1];
      if (storagePath) {
        await supabase.storage.from("audio").remove([storagePath]);
      }
    }

    // Delete from voice_profiles table
    await supabase
      .from("voice_profiles")
      .delete()
      .eq("id", voice_profile_id);

    return jsonResponse({ success: true, voice_profile_id });
  } catch (err) {
    return jsonResponse(
      { success: false, error: String(err) },
      500,
    );
  }
}
