import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WeatherResponse {
  main: {
    temp: number;
    temp_max: number;
    temp_min: number;
  };
  weather: Array<{
    description: string;
    icon: string;
  }>;
  name: string;
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

/**
 * Get local time components in a given IANA timezone.
 */
function getLocalTime(
  utcDate: Date,
  timezone: string,
): { hours: number; minutes: number } {
  const localStr = utcDate.toLocaleString("en-US", { timeZone: timezone });
  const localDate = new Date(localStr);
  return { hours: localDate.getHours(), minutes: localDate.getMinutes() };
}

/**
 * Fetch current weather from OpenWeatherMap.
 * Uses the timezone string to guess a city name as a fallback.
 */
async function fetchWeather(
  timezone: string,
): Promise<{ temp: number; description: string } | null> {
  const apiKey = Deno.env.get("OPENWEATHER_API_KEY");
  if (!apiKey) return null;

  try {
    // Extract city from timezone (e.g., "America/New_York" -> "New York")
    const city = timezone.split("/").pop()?.replace(/_/g, " ") ?? "New York";

    const resp = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=imperial`,
    );

    if (!resp.ok) return null;

    const data: WeatherResponse = await resp.json();
    return {
      temp: Math.round(data.main.temp),
      description: data.weather[0]?.description ?? "clear",
    };
  } catch {
    return null;
  }
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

    const now = new Date();

    // Get all parents with a checkin_time and push_token
    const { data: parents, error: parentsError } = await supabase
      .from("users")
      .select("id, name, checkin_time, timezone, push_token")
      .eq("role", "parent")
      .not("checkin_time", "is", null)
      .not("push_token", "is", null);

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
        JSON.stringify({ success: true, sent: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let sent = 0;

    // Cache weather per timezone to avoid redundant API calls
    const weatherCache = new Map<string, { temp: number; description: string } | null>();

    for (const parent of parents) {
      const tz = parent.timezone || "America/New_York";
      const localNow = getLocalTime(now, tz);

      // Parse parent's checkin_time (HH:mm:ss or HH:mm)
      const timeParts = (parent.checkin_time as string).split(":").map(Number);
      const checkinHour = timeParts[0];
      const checkinMin = timeParts[1];

      // Check if current local time is within the 5-minute window of checkin_time
      const nowTotalMin = localNow.hours * 60 + localNow.minutes;
      const checkinTotalMin = checkinHour * 60 + checkinMin;
      const diff = nowTotalMin - checkinTotalMin;

      if (diff < 0 || diff >= 5) {
        continue; // Not within the reminder window
      }

      // Fetch weather (with caching per timezone)
      if (!weatherCache.has(tz)) {
        weatherCache.set(tz, await fetchWeather(tz));
      }
      const weather = weatherCache.get(tz);

      let messageBody: string;
      if (weather) {
        messageBody = `Good morning! ${weather.temp}\u00B0F and ${weather.description} today \u2600\uFE0F Time to check in!`;
      } else {
        messageBody = `Good morning, ${parent.name}! Time to check in for today \u2600\uFE0F`;
      }

      await sendExpoPush(
        [parent.push_token!],
        "Good Morning!",
        messageBody,
        { type: "morning_reminder", user_id: parent.id },
      );
      sent++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        total_parents: parents.length,
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
