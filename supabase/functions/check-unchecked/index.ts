import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

/**
 * Convert a UTC Date to the local time in a given IANA timezone
 * and return hours/minutes in that zone.
 */
function getLocalTime(
  utcDate: Date,
  timezone: string,
): { hours: number; minutes: number } {
  const localStr = utcDate.toLocaleString("en-US", { timeZone: timezone });
  const localDate = new Date(localStr);
  return { hours: localDate.getHours(), minutes: localDate.getMinutes() };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Allow both POST (from pg_cron/webhook) and GET (for manual trigger)
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date();

    // Get all parents who have a checkin_time configured
    const { data: parents, error: parentsError } = await supabase
      .from("users")
      .select("id, name, family_id, checkin_time, alert_delay_minutes, timezone, push_token")
      .eq("role", "parent")
      .not("checkin_time", "is", null);

    if (parentsError) {
      return new Response(
        JSON.stringify({ error: "Failed to query parents", details: parentsError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!parents || parents.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let reminders_sent = 0;
    let alerts_sent = 0;

    for (const parent of parents) {
      const tz = parent.timezone || "America/New_York";
      const localNow = getLocalTime(now, tz);

      // Parse parent's checkin_time (HH:mm:ss or HH:mm)
      const timeParts = (parent.checkin_time as string).split(":").map(Number);
      const checkinHour = timeParts[0];
      const checkinMin = timeParts[1];

      // Calculate minutes elapsed since checkin time (in parent's local time)
      const nowTotalMin = localNow.hours * 60 + localNow.minutes;
      const checkinTotalMin = checkinHour * 60 + checkinMin;
      const minutesSinceCheckin = nowTotalMin - checkinTotalMin;

      // Only process if check-in time has passed but not more than 24h
      if (minutesSinceCheckin < 0 || minutesSinceCheckin > 1440) {
        continue;
      }

      // Check if they already checked in today (in their timezone)
      const todayLocalStr = now.toLocaleDateString("en-CA", { timeZone: tz }); // YYYY-MM-DD
      const startOfDay = `${todayLocalStr}T00:00:00`;
      const endOfDay = `${todayLocalStr}T23:59:59`;

      const { data: todayCheckins } = await supabase
        .from("checkins")
        .select("id")
        .eq("user_id", parent.id)
        .gte("checked_in_at", startOfDay)
        .lte("checked_in_at", endOfDay)
        .limit(1);

      if (todayCheckins && todayCheckins.length > 0) {
        // Already checked in today
        continue;
      }

      const alertDelay = parent.alert_delay_minutes ?? 120;

      // Tier 1: 25-30 minutes past checkin_time -> send 2nd reminder to parent
      if (minutesSinceCheckin >= 25 && minutesSinceCheckin < 30) {
        if (parent.push_token) {
          await sendExpoPush(
            [parent.push_token],
            "Reminder: Check in now",
            `Hi ${parent.name}, you haven't checked in yet today. Tap to check in now!`,
            { type: "checkin_reminder", user_id: parent.id },
          );
          reminders_sent++;
        }
      }

      // Tier 2: Past alert_delay_minutes -> alert all family members
      if (minutesSinceCheckin >= alertDelay) {
        const { data: familyMembers } = await supabase
          .from("users")
          .select("push_token, name")
          .eq("family_id", parent.family_id)
          .neq("id", parent.id);

        if (familyMembers) {
          const tokens = familyMembers
            .map((m) => m.push_token)
            .filter(Boolean) as string[];

          await sendExpoPush(
            tokens,
            "⚠️ Missed Check-in Alert",
            `${parent.name} hasn't checked in today. It's been ${minutesSinceCheckin} minutes past their usual time.`,
            {
              type: "missed_checkin_alert",
              user_id: parent.id,
              minutes_late: minutesSinceCheckin,
            },
          );
          alerts_sent++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: parents.length,
        reminders_sent,
        alerts_sent,
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
