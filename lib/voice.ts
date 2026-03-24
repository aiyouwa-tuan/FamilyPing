import { supabase } from './supabase';
import type { VoiceCall, ConversationMemory } from './types';

// =============================================================================
// FamilyPing V3.0 - Voice Call Client Library
// =============================================================================

/**
 * Fetches recent voice calls for a user, ordered by started_at DESC.
 */
export async function getRecentCalls(
  userId: string,
  limit: number = 10,
): Promise<VoiceCall[]> {
  const { data, error } = await supabase
    .from('voice_calls')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Voice] Failed to fetch recent calls:', error.message);
    return [];
  }

  return (data ?? []) as VoiceCall[];
}

/**
 * Fetches a single call with full transcript and details.
 */
export async function getCallDetail(
  callId: string,
): Promise<VoiceCall | null> {
  const { data, error } = await supabase
    .from('voice_calls')
    .select('*')
    .eq('id', callId)
    .single();

  if (error) {
    console.error('[Voice] Failed to fetch call detail:', error.message);
    return null;
  }

  return data as VoiceCall;
}

/**
 * Fetches all conversation memory topics for a user.
 */
export async function getConversationMemories(
  userId: string,
): Promise<ConversationMemory[]> {
  const { data, error } = await supabase
    .from('conversation_memory')
    .select('*')
    .eq('user_id', userId)
    .order('last_mentioned_at', { ascending: false });

  if (error) {
    console.error('[Voice] Failed to fetch conversation memories:', error.message);
    return [];
  }

  return (data ?? []) as ConversationMemory[];
}

/**
 * Fetches mood scores over a period for a trend chart.
 * Returns {date, score} pairs ordered by date ascending.
 */
export async function getMoodTrend(
  userId: string,
  days: number = 30,
): Promise<{ date: string; score: number }[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('voice_calls')
    .select('started_at, mood_score')
    .eq('user_id', userId)
    .gte('started_at', since.toISOString())
    .not('mood_score', 'is', null)
    .order('started_at', { ascending: true });

  if (error) {
    console.error('[Voice] Failed to fetch mood trend:', error.message);
    return [];
  }

  return (data ?? []).map((row: { started_at: string; mood_score: number }) => ({
    date: row.started_at.split('T')[0],
    score: row.mood_score,
  }));
}

/**
 * Stores a proxy message for the AI to relay during the next call.
 * Uses the messages table with a special message_type.
 */
export async function sendProxyMessage(
  userId: string,
  message: string,
): Promise<boolean> {
  // Get user's family_id and the sender (current auth user)
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return false;

  const { data: profile } = await supabase
    .from('users')
    .select('family_id')
    .eq('id', authUser.id)
    .single();

  if (!profile) return false;

  const { error } = await supabase.from('messages').insert({
    family_id: profile.family_id,
    sender_id: authUser.id,
    recipient_role: 'parent',
    content: message,
    message_type: 'voice', // proxy message for next voice call
  });

  if (error) {
    console.error('[Voice] Failed to send proxy message:', error.message);
    return false;
  }

  return true;
}

/**
 * Mock: Sets up a daily call time preference for the user.
 * In production, this would schedule a cron trigger.
 */
export async function scheduleCall(
  userId: string,
  time: string, // HH:mm format
): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .update({ checkin_time: time })
    .eq('id', userId);

  if (error) {
    console.error('[Voice] Failed to schedule call:', error.message);
    return false;
  }

  // In production: register with a scheduler service (pg_cron, etc.)
  console.log(`[Voice] Scheduled daily call for user ${userId} at ${time}`);
  return true;
}
