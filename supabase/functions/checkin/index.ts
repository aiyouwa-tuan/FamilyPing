import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Mood = "great" | "ok" | "not_great";

interface CheckinRequest {
  mood: Mood;
  question_id?: number;
  question_answer?: string;
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client for admin operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get the user profile
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

    const body: CheckinRequest = await req.json();
    const { mood, question_id, question_answer } = body;

    if (!mood || !["great", "ok", "not_great"].includes(mood)) {
      return new Response(JSON.stringify({ error: "Invalid mood value" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate delay from expected check-in time
    let checkin_delay_minutes: number | null = null;
    if (profile.checkin_time) {
      const now = new Date();
      const [hours, minutes] = (profile.checkin_time as string).split(":").map(Number);
      const expected = new Date(now);
      expected.setHours(hours, minutes, 0, 0);
      checkin_delay_minutes = Math.round(
        (now.getTime() - expected.getTime()) / 60000,
      );
      if (checkin_delay_minutes < 0) checkin_delay_minutes = 0;
    }

    // Insert the check-in
    const { data: checkin, error: checkinError } = await supabase
      .from("checkins")
      .insert({
        user_id: authUser.id,
        mood,
        question_id: question_id ?? null,
        question_answer: question_answer ?? null,
        checkin_delay_minutes,
      })
      .select()
      .single();

    if (checkinError) {
      return new Response(
        JSON.stringify({ error: "Failed to create check-in", details: checkinError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Calculate streak: consecutive days with at least one check-in
    const { data: recentCheckins } = await supabase
      .from("checkins")
      .select("checked_in_at")
      .eq("user_id", authUser.id)
      .order("checked_in_at", { ascending: false })
      .limit(365);

    let streak = 0;
    if (recentCheckins && recentCheckins.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const checkinDates = new Set(
        recentCheckins.map((c) => {
          const d = new Date(c.checked_in_at);
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        }),
      );

      for (let i = 0; i <= 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (checkinDates.has(key)) {
          streak++;
        } else {
          break;
        }
      }
    }

    // Update last_active_at
    await supabase
      .from("users")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", authUser.id);

    // Push notification to all family members
    const { data: familyMembers } = await supabase
      .from("users")
      .select("push_token, name")
      .eq("family_id", profile.family_id)
      .neq("id", authUser.id);

    if (familyMembers) {
      const tokens = familyMembers
        .map((m) => m.push_token)
        .filter(Boolean) as string[];

      const moodEmoji = mood === "great" ? "😊" : mood === "ok" ? "🙂" : "😔";
      await sendExpoPush(
        tokens,
        "Check-in received!",
        `${profile.name} checked in ${moodEmoji} (${streak} day streak)`,
        { type: "checkin", checkin_id: checkin.id, user_id: authUser.id },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        streak,
        checkin_id: checkin.id,
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
