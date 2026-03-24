import { supabase } from './supabase';
import type { User, Family, UserRole } from './types';

// ---------------------------------------------------------------------------
// Phone auth
// ---------------------------------------------------------------------------

/** Send a one-time-password to the given phone number via Supabase Auth. */
export async function signInWithPhone(phone: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message ?? 'Failed to send OTP' };
  }
}

/** Verify the OTP code that was sent to the phone number. */
export async function verifyOTP(
  phone: string,
  token: string,
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message ?? 'Failed to verify OTP' };
  }
}

// ---------------------------------------------------------------------------
// Family management
// ---------------------------------------------------------------------------

/** Create a new family and add the current user as the first parent. */
export async function createFamily(
  userName: string,
): Promise<{ family: Family | null; user: User | null; error: string | null }> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      return { family: null, user: null, error: 'Not authenticated' };
    }

    const authUser = sessionData.session.user;

    // Generate a short random invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create family record
    const { data: family, error: familyError } = await supabase
      .from('families')
      .insert({
        name: `${userName}'s Family`,
        invite_code: inviteCode,
        plan: 'free',
      })
      .select()
      .single();

    if (familyError || !family) {
      return { family: null, user: null, error: familyError?.message ?? 'Failed to create family' };
    }

    // Create user record
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        family_id: family.id,
        role: 'parent' as UserRole,
        name: userName,
        phone: authUser.phone ?? '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        alert_delay_minutes: 120,
        avatar_emoji: '👵',
      })
      .select()
      .single();

    if (userError || !user) {
      return { family: null, user: null, error: userError?.message ?? 'Failed to create user' };
    }

    return { family: family as Family, user: user as User, error: null };
  } catch (err: any) {
    return { family: null, user: null, error: err.message ?? 'Failed to create family' };
  }
}

/** Join an existing family using an invite code. */
export async function joinFamily(
  inviteCode: string,
  userName: string,
  role: 'parent' | 'family',
): Promise<{ family: Family | null; user: User | null; error: string | null }> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      return { family: null, user: null, error: 'Not authenticated' };
    }

    const authUser = sessionData.session.user;

    // Look up family by invite code
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select()
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (familyError || !family) {
      return { family: null, user: null, error: 'Invalid invite code' };
    }

    // Create user record
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        family_id: family.id,
        role,
        name: userName,
        phone: authUser.phone ?? '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        alert_delay_minutes: 120,
        avatar_emoji: role === 'parent' ? '👵' : '👩',
      })
      .select()
      .single();

    if (userError || !user) {
      return { family: null, user: null, error: userError?.message ?? 'Failed to join family' };
    }

    return { family: family as Family, user: user as User, error: null };
  } catch (err: any) {
    return { family: null, user: null, error: err.message ?? 'Failed to join family' };
  }
}

// ---------------------------------------------------------------------------
// User settings
// ---------------------------------------------------------------------------

/** Update the daily check-in time for the current user. */
export async function setCheckinTime(
  time: string,
): Promise<{ error: string | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('users')
      .update({ checkin_time: time })
      .eq('id', sessionData.session.user.id);

    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message ?? 'Failed to set checkin time' };
  }
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

/** Sign out the current user. */
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message ?? 'Failed to sign out' };
  }
}

/** Get the current session and associated user profile from the database. */
export async function getCurrentUser(): Promise<{
  authUser: any | null;
  profile: User | null;
  family: Family | null;
  error: string | null;
}> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      return { authUser: null, profile: null, family: null, error: sessionError?.message ?? null };
    }

    const authUser = sessionData.session.user;

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select()
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      return { authUser, profile: null, family: null, error: null };
    }

    // Fetch family
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select()
      .eq('id', profile.family_id)
      .single();

    return {
      authUser,
      profile: profile as User,
      family: familyError ? null : (family as Family),
      error: null,
    };
  } catch (err: any) {
    return { authUser: null, profile: null, family: null, error: err.message ?? 'Unknown error' };
  }
}
