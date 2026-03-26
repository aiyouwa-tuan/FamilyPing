import { createClient } from '@/lib/supabase'
import type {
  VoiceProfile,
  TTSResult,
  TTSUsageSummary,
} from '@/lib/voice-engine-types'
import {
  TTSQuotaExceeded,
  VoiceCloneFailed,
  TTSServiceUnavailable,
} from '@/lib/voice-engine-types'

const FISH_AUDIO_TTS_URL = 'https://api.fish.audio/v1/tts'
const FISH_AUDIO_CLONE_URL = 'https://api.fish.audio/v1/models'

const DAILY_CHAR_LIMIT_FREE = 5000
const DAILY_CHAR_LIMIT_PAID = 20000

const COST_PER_CHAR_FISH = 0.000015 // ~$15 per 1M chars
const COST_PER_CHAR_ELEVENLABS = 0.00003 // ~$30 per 1M chars

const CLONE_POLL_INTERVAL_MS = 3000
const CLONE_POLL_MAX_ATTEMPTS = 40 // ~2 minutes

function getFishAudioApiKey(): string {
  const key = process.env.NEXT_PUBLIC_FISH_AUDIO_API_KEY || process.env.FISH_AUDIO_API_KEY
  if (!key) throw new TTSServiceUnavailable('fish_audio', 'API key not configured')
  return key
}

function getElevenLabsApiKey(): string | null {
  return process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY || null
}

/**
 * Synthesize speech from text using Fish Audio TTS.
 * Falls back to ElevenLabs, then browser SpeechSynthesis if APIs fail.
 */
export async function synthesizeSpeech(
  text: string,
  voiceProfileId?: string
): Promise<TTSResult> {
  const charCount = text.length

  try {
    const apiKey = getFishAudioApiKey()
    const body: Record<string, unknown> = {
      text,
      format: 'mp3',
    }

    if (voiceProfileId) {
      // Look up the provider voice ID from our database
      const supabase = createClient()
      const { data: profile } = await supabase
        .from('voice_profiles')
        .select('provider_voice_id, provider')
        .eq('id', voiceProfileId)
        .single()

      if (profile?.provider_voice_id) {
        body.model_id = profile.provider_voice_id
      }
    }

    const response = await fetch(FISH_AUDIO_TTS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new TTSServiceUnavailable('fish_audio', `HTTP ${response.status}: ${errorText}`)
    }

    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)
    const cost = charCount * COST_PER_CHAR_FISH

    return { audioUrl, cost, charCount }
  } catch (error) {
    if (error instanceof TTSQuotaExceeded) throw error

    // Try ElevenLabs as fallback
    const elevenLabsKey = getElevenLabsApiKey()
    if (elevenLabsKey) {
      try {
        return await synthesizeWithElevenLabs(text, elevenLabsKey)
      } catch {
        // Fall through to browser fallback
      }
    }

    // Final fallback: browser SpeechSynthesis
    return synthesizeWithBrowser(text)
  }
}

async function synthesizeWithElevenLabs(
  text: string,
  apiKey: string
): Promise<TTSResult> {
  const voiceId = 'EXAVITQu4vr4xnSDxMaL' // Default "Sarah" voice
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  )

  if (!response.ok) {
    throw new TTSServiceUnavailable('elevenlabs', `HTTP ${response.status}`)
  }

  const audioBlob = await response.blob()
  const audioUrl = URL.createObjectURL(audioBlob)
  const charCount = text.length
  const cost = charCount * COST_PER_CHAR_ELEVENLABS

  return { audioUrl, cost, charCount }
}

function synthesizeWithBrowser(text: string): Promise<TTSResult> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      reject(new TTSServiceUnavailable('browser', 'SpeechSynthesis not available'))
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.9

    utterance.onend = () => {
      resolve({
        audioUrl: '', // Browser synthesis plays directly, no URL
        cost: 0,
        charCount: text.length,
      })
    }

    utterance.onerror = (event) => {
      reject(new TTSServiceUnavailable('browser', event.error))
    }

    window.speechSynthesis.speak(utterance)
  })
}

/**
 * Create a voice clone from an audio recording.
 * Uploads to Supabase Storage, sends to Fish Audio, and polls until ready.
 */
export async function createVoiceClone(
  audioBlob: Blob,
  name: string,
  familyId: string
): Promise<VoiceProfile> {
  const supabase = createClient()
  const apiKey = getFishAudioApiKey()

  // Get current user
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) throw new VoiceCloneFailed('User not authenticated')

  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single()
  if (!dbUser) throw new VoiceCloneFailed('User profile not found')

  // Upload audio sample to Supabase Storage
  const fileName = `voice-samples/${familyId}/${Date.now()}-${name.replace(/\s+/g, '_')}.wav`
  const { error: uploadError } = await supabase.storage
    .from('audio')
    .upload(fileName, audioBlob, {
      contentType: audioBlob.type || 'audio/wav',
      upsert: false,
    })

  if (uploadError) {
    throw new VoiceCloneFailed(`Upload failed: ${uploadError.message}`)
  }

  const { data: urlData } = supabase.storage.from('audio').getPublicUrl(fileName)
  const audioSampleUrl = urlData.publicUrl

  // Estimate duration (rough: ~16kB/s for WAV at 16kHz mono)
  const durationSeconds = Math.round(audioBlob.size / 16000)

  // Send to Fish Audio for voice cloning
  const formData = new FormData()
  formData.append('name', name)
  formData.append('description', `FamilyPing voice clone for ${name}`)
  formData.append('file', audioBlob, 'sample.wav')

  let providerVoiceId: string | null = null

  try {
    const cloneResponse = await fetch(FISH_AUDIO_CLONE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    })

    if (!cloneResponse.ok) {
      const errorText = await cloneResponse.text().catch(() => 'Unknown error')
      throw new VoiceCloneFailed(`Fish Audio API error: HTTP ${cloneResponse.status} - ${errorText}`)
    }

    const cloneResult = await cloneResponse.json()
    providerVoiceId = cloneResult.id || cloneResult.model_id || null
  } catch (error) {
    if (error instanceof VoiceCloneFailed) throw error
    throw new VoiceCloneFailed(`Network error: ${(error as Error).message}`)
  }

  if (!providerVoiceId) {
    throw new VoiceCloneFailed('No voice ID returned from provider')
  }

  // Insert voice profile into database
  const { data: profile, error: insertError } = await supabase
    .from('voice_profiles')
    .insert({
      family_id: familyId,
      name,
      recorded_by: dbUser.id,
      provider: 'fish_audio',
      provider_voice_id: providerVoiceId,
      audio_sample_url: audioSampleUrl,
      duration_seconds: durationSeconds,
      status: 'processing',
    })
    .select()
    .single()

  if (insertError || !profile) {
    throw new VoiceCloneFailed(`Database insert failed: ${insertError?.message || 'No data returned'}`)
  }

  // Poll until the voice clone is ready or failed
  const readyProfile = await pollVoiceCloneStatus(profile.id, providerVoiceId, apiKey)
  return readyProfile
}

async function pollVoiceCloneStatus(
  profileId: string,
  providerVoiceId: string,
  apiKey: string
): Promise<VoiceProfile> {
  const supabase = createClient()

  for (let attempt = 0; attempt < CLONE_POLL_MAX_ATTEMPTS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, CLONE_POLL_INTERVAL_MS))

    try {
      const statusResponse = await fetch(`${FISH_AUDIO_CLONE_URL}/${providerVoiceId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })

      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        const providerStatus = statusData.status || statusData.state

        if (providerStatus === 'ready' || providerStatus === 'completed' || providerStatus === 'active') {
          const { data: updated } = await supabase
            .from('voice_profiles')
            .update({
              status: 'ready',
              quality_score: statusData.quality_score || statusData.quality || 0,
            })
            .eq('id', profileId)
            .select()
            .single()

          if (updated) return updated as VoiceProfile
        } else if (providerStatus === 'failed' || providerStatus === 'error') {
          await supabase
            .from('voice_profiles')
            .update({ status: 'failed' })
            .eq('id', profileId)

          throw new VoiceCloneFailed('Provider reported clone failure')
        }
      }
    } catch (error) {
      if (error instanceof VoiceCloneFailed) throw error
      // Network error during poll, continue trying
    }
  }

  // Timed out
  await supabase
    .from('voice_profiles')
    .update({ status: 'failed' })
    .eq('id', profileId)

  throw new VoiceCloneFailed('Voice clone timed out after polling')
}

/**
 * Get all voice profiles for a family.
 */
export async function getVoiceProfiles(familyId: string): Promise<VoiceProfile[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('voice_profiles')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch voice profiles:', error.message)
    return []
  }

  return (data || []) as VoiceProfile[]
}

/**
 * Delete a voice profile from both Fish Audio and Supabase.
 */
export async function deleteVoiceProfile(id: string): Promise<void> {
  const supabase = createClient()

  const { data: profile, error: fetchError } = await supabase
    .from('voice_profiles')
    .select('provider_voice_id, provider, audio_sample_url')
    .eq('id', id)
    .single()

  if (fetchError || !profile) {
    throw new Error(`Voice profile not found: ${fetchError?.message || 'No data'}`)
  }

  // Delete from Fish Audio
  if (profile.provider_voice_id) {
    try {
      const apiKey = getFishAudioApiKey()
      await fetch(`${FISH_AUDIO_CLONE_URL}/${profile.provider_voice_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })
    } catch (error) {
      console.warn('Failed to delete voice from provider:', (error as Error).message)
    }
  }

  // Delete audio sample from storage
  if (profile.audio_sample_url) {
    try {
      const url = new URL(profile.audio_sample_url)
      const storagePath = url.pathname.split('/audio/')[1]
      if (storagePath) {
        await supabase.storage.from('audio').remove([storagePath])
      }
    } catch {
      console.warn('Failed to delete audio sample from storage')
    }
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from('voice_profiles')
    .delete()
    .eq('id', id)

  if (deleteError) {
    throw new Error(`Failed to delete voice profile: ${deleteError.message}`)
  }
}

/**
 * Get today's TTS usage for a family.
 */
export async function getDailyTTSUsage(familyId: string): Promise<TTSUsageSummary> {
  const supabase = createClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('tts_usage')
    .select('character_count, cost_usd')
    .eq('family_id', familyId)
    .gte('created_at', todayStart.toISOString())

  if (error) {
    console.error('Failed to fetch TTS usage:', error.message)
    return { charCount: 0, cost: 0, limit: DAILY_CHAR_LIMIT_FREE }
  }

  const charCount = (data || []).reduce((sum, row) => sum + (row.character_count || 0), 0)
  const cost = (data || []).reduce((sum, row) => sum + (row.cost_usd || 0), 0)

  // Determine limit based on family plan
  const { data: family } = await supabase
    .from('families')
    .select('plan')
    .eq('id', familyId)
    .single()

  const limit = family?.plan === 'paid' || family?.plan === 'premium'
    ? DAILY_CHAR_LIMIT_PAID
    : DAILY_CHAR_LIMIT_FREE

  return { charCount, cost, limit }
}

/**
 * Record TTS usage for cost tracking.
 */
export async function trackTTSUsage(
  familyId: string,
  userId: string,
  voiceProfileId: string | null,
  charCount: number,
  cost: number,
  provider: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('tts_usage')
    .insert({
      family_id: familyId,
      user_id: userId,
      voice_profile_id: voiceProfileId,
      character_count: charCount,
      cost_usd: cost,
      provider,
    })

  if (error) {
    console.error('Failed to track TTS usage:', error.message)
  }
}
