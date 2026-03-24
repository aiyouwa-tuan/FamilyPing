import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface SOSRequest {
  location_lat?: number;
  location_lng?: number;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
      priority: "high",
      channelId: "sos",
    }));

  if (messages.length === 0) return;

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });
}

async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      {
        headers: {
          "User-Agent": "FamilyPing/1.0",
        },
      },
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.display_name ?? null;
  } catch {
    return null;
  }
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify user has "parent" role
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile.role !== "parent") {
      return new Response(
        JSON.stringify({ error: "Only parents can trigger SOS" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body: SOSRequest = await req.json();
    const { location_lat, location_lng } = body;

    // Reverse geocode if coordinates provided
    let location_address: string | null = null;
    if (location_lat != null && location_lng != null) {
      location_address = await reverseGeocode(location_lat, location_lng);
    }

    // Insert SOS event
    const { data: sosEvent, error: sosError } = await supabase
      .from("sos_events")
      .insert({
        user_id: authUser.id,
        location_lat: location_lat ?? null,
        location_lng: location_lng ?? null,
        location_address,
      })
      .select()
      .single();

    if (sosError) {
      return new Response(
        JSON.stringify({ error: "Failed to create SOS event", details: sosError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Push notification to ALL family members
    const { data: familyMembers } = await supabase
      .from("users")
      .select("push_token, name")
      .eq("family_id", profile.family_id)
      .neq("id", authUser.id);

    if (familyMembers) {
      const tokens = familyMembers
        .map((m) => m.push_token)
        .filter(Boolean) as string[];

      const locationText = location_address
        ? ` Near: ${location_address}`
        : location_lat != null
          ? ` Location: ${location_lat}, ${location_lng}`
          : "";

      await sendExpoPush(
        tokens,
        "🚨 SOS Alert!",
        `${profile.name} needs help!${locationText}`,
        {
          type: "sos",
          sos_id: sosEvent.id,
          user_id: authUser.id,
          location_lat,
          location_lng,
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        sos_id: sosEvent.id,
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
