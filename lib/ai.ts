import { supabase } from './supabase';
import type { DailyInsight } from './types';

// =============================================================================
// FamilyPing V2.5 - AI Brain Client Functions
// =============================================================================

// ---------------------------------------------------------------------------
// Daily Insights
// ---------------------------------------------------------------------------

/** Fetch daily insight for a user. Defaults to today's date. */
export async function getDailyInsight(
  userId: string,
  date?: string,
): Promise<{ insight: DailyInsight | null; error: string | null }> {
  try {
    const targetDate = date ?? new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_insights')
      .select('*')
      .eq('user_id', userId)
      .eq('date', targetDate)
      .single();

    if (error) {
      // PGRST116 = no rows found, which is not an error for us
      if (error.code === 'PGRST116') {
        return { insight: null, error: null };
      }
      return { insight: null, error: error.message };
    }

    return { insight: data as DailyInsight, error: null };
  } catch (err: any) {
    return { insight: null, error: err.message ?? 'Failed to fetch daily insight' };
  }
}

/** Fetch recent insights for a user (last N days, default 7). */
export async function getRecentInsights(
  userId: string,
  days: number = 7,
): Promise<{ insights: DailyInsight[]; error: string | null }> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_insights')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .order('date', { ascending: false });

    if (error) return { insights: [], error: error.message };
    return { insights: (data ?? []) as DailyInsight[], error: null };
  } catch (err: any) {
    return { insights: [], error: err.message ?? 'Failed to fetch recent insights' };
  }
}

// ---------------------------------------------------------------------------
// Conversational AI
// ---------------------------------------------------------------------------

interface QueryAIResponse {
  answer: string;
  data_points: any[];
}

/** Send a natural language question to the AI query edge function. */
export async function queryAI(
  question: string,
): Promise<{ result: QueryAIResponse | null; error: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('query-ai', {
      body: { question },
    });

    if (error) return { result: null, error: error.message };

    return {
      result: data as QueryAIResponse,
      error: null,
    };
  } catch (err: any) {
    return { result: null, error: err.message ?? 'Failed to query AI' };
  }
}

// ---------------------------------------------------------------------------
// Personalized Daily Question
// ---------------------------------------------------------------------------

/** Generate an AI-personalized daily question based on the user's past answers. */
export async function getPersonalizedQuestion(
  userId: string,
): Promise<{ question: string | null; error: string | null }> {
  try {
    // Fetch last 14 days of checkin answers for context
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];

    const { data: checkins, error: checkinError } = await supabase
      .from('checkins')
      .select('question_id, question_answer, mood, checked_in_at')
      .eq('user_id', userId)
      .gte('checked_in_at', twoWeeksAgoStr)
      .order('checked_in_at', { ascending: false })
      .limit(14);

    if (checkinError) return { question: null, error: checkinError.message };

    // Fetch recent insights for additional context
    const { data: insights } = await supabase
      .from('daily_insights')
      .select('date, status, summary')
      .eq('user_id', userId)
      .gte('date', twoWeeksAgoStr)
      .order('date', { ascending: false })
      .limit(7);

    // Call edge function to generate personalized question
    const { data, error } = await supabase.functions.invoke('query-ai', {
      body: {
        question: `Generate a single warm, personalized daily check-in question for this parent based on their recent answers and mood patterns. Recent checkins: ${JSON.stringify(
          (checkins ?? []).map((c) => ({
            mood: c.mood,
            answer: c.question_answer,
            date: c.checked_in_at,
          })),
        )}. Recent insights: ${JSON.stringify(
          (insights ?? []).map((i) => ({
            date: i.date,
            status: i.status,
            summary: i.summary,
          })),
        )}. Return just the question text, nothing else.`,
      },
    });

    if (error) return { question: null, error: error.message };

    // The AI should return an answer field with just the question text
    const result = data as QueryAIResponse;
    return { question: result.answer ?? null, error: null };
  } catch (err: any) {
    return { question: null, error: err.message ?? 'Failed to generate personalized question' };
  }
}
