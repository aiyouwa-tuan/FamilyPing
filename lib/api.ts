import { supabase } from './supabase';
import type { Checkin, Mood, User, WeatherData } from './types';

// ---------------------------------------------------------------------------
// Check-ins
// ---------------------------------------------------------------------------

/** Submit a daily check-in via the checkin edge function. */
export async function submitCheckin(
  mood: Mood,
  questionId?: number,
  questionAnswer?: string,
): Promise<{ checkin: Checkin | null; error: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('checkin', {
      body: { mood, question_id: questionId ?? null, question_answer: questionAnswer ?? null },
    });

    if (error) return { checkin: null, error: error.message };
    return { checkin: data as Checkin, error: null };
  } catch (err: any) {
    return { checkin: null, error: err.message ?? 'Failed to submit check-in' };
  }
}

/** Fetch check-in history for a given user, ordered most-recent first. */
export async function getCheckinHistory(
  userId: string,
  limit: number = 30,
): Promise<{ checkins: Checkin[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', userId)
      .order('checked_in_at', { ascending: false })
      .limit(limit);

    if (error) return { checkins: [], error: error.message };
    return { checkins: (data ?? []) as Checkin[], error: null };
  } catch (err: any) {
    return { checkins: [], error: err.message ?? 'Failed to fetch check-in history' };
  }
}

// ---------------------------------------------------------------------------
// Family status
// ---------------------------------------------------------------------------

interface FamilyMemberStatus {
  user: User;
  latestCheckin: Checkin | null;
}

/**
 * Fetch all family members and their most recent check-in.
 * Requires the current user to be authenticated.
 */
export async function getFamilyStatus(): Promise<{
  members: FamilyMemberStatus[];
  error: string | null;
}> {
  try {
    // Get current user's family_id
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return { members: [], error: 'Not authenticated' };

    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', sessionData.session.user.id)
      .single();

    if (userError || !currentUser) return { members: [], error: 'User not found' };

    // Fetch all family members
    const { data: users, error: membersError } = await supabase
      .from('users')
      .select('*')
      .eq('family_id', currentUser.family_id);

    if (membersError) return { members: [], error: membersError.message };

    // For each member, fetch their latest check-in
    const members: FamilyMemberStatus[] = await Promise.all(
      (users ?? []).map(async (user: User) => {
        const { data: checkins } = await supabase
          .from('checkins')
          .select('*')
          .eq('user_id', user.id)
          .order('checked_in_at', { ascending: false })
          .limit(1);

        return {
          user,
          latestCheckin: checkins && checkins.length > 0 ? (checkins[0] as Checkin) : null,
        };
      }),
    );

    return { members, error: null };
  } catch (err: any) {
    return { members: [], error: err.message ?? 'Failed to fetch family status' };
  }
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

/** Send a message via the send-message edge function. */
export async function sendMessage(
  content: string,
  recipientRole: 'parent' | 'family' | 'all',
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.functions.invoke('send-message', {
      body: { content, recipient_role: recipientRole },
    });

    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message ?? 'Failed to send message' };
  }
}

// ---------------------------------------------------------------------------
// SOS
// ---------------------------------------------------------------------------

/** Trigger an SOS alert via the sos edge function. */
export async function triggerSOS(
  lat?: number,
  lng?: number,
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.functions.invoke('sos', {
      body: { lat: lat ?? null, lng: lng ?? null },
    });

    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message ?? 'Failed to trigger SOS' };
  }
}

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------

/** Send an invite SMS via the send-invite edge function. */
export async function sendInvite(
  phone: string,
  parentName: string,
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.functions.invoke('send-invite', {
      body: { phone, parent_name: parentName },
    });

    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message ?? 'Failed to send invite' };
  }
}

// ---------------------------------------------------------------------------
// Weather
// ---------------------------------------------------------------------------

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY ?? 'YOUR_OPENWEATHER_API_KEY';

/** Fetch current weather from OpenWeatherMap. */
export async function getWeather(
  lat: number,
  lng: number,
): Promise<{ weather: WeatherData | null; error: string | null }> {
  try {
    const url =
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}` +
      `&units=imperial&appid=${OPENWEATHER_API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) return { weather: null, error: `Weather API returned ${res.status}` };

    const json = await res.json();

    const weather: WeatherData = {
      temp: Math.round(json.main.temp),
      description: json.weather?.[0]?.description ?? '',
      icon: weatherIconFromCode(json.weather?.[0]?.icon ?? ''),
      high: Math.round(json.main.temp_max),
      low: Math.round(json.main.temp_min),
      rain_chance: json.rain ? 100 : json.clouds?.all ?? 0,
      city: json.name ?? '',
    };

    return { weather, error: null };
  } catch (err: any) {
    return { weather: null, error: err.message ?? 'Failed to fetch weather' };
  }
}

/** Map an OpenWeatherMap icon code to an emoji. */
function weatherIconFromCode(code: string): string {
  const map: Record<string, string> = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️',
  };
  return map[code] ?? '🌤️';
}
