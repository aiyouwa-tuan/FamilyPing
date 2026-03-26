export interface VoiceProfile {
  id: string
  family_id: string
  name: string
  recorded_by: string
  provider: 'fish_audio' | 'elevenlabs'
  provider_voice_id: string | null
  audio_sample_url: string | null
  duration_seconds: number | null
  quality_score: number
  status: 'processing' | 'ready' | 'failed'
  created_at: string
}

export interface TTSResult {
  audioUrl: string
  cost: number
  charCount: number
}

export interface TTSOptions {
  voiceProfileId?: string
  provider?: 'fish_audio' | 'elevenlabs'
  speed?: number
  language?: string
}

export interface VoiceCloneRequest {
  audioBlob: Blob
  name: string
  familyId: string
}

export interface TTSUsage {
  id: string
  family_id: string
  user_id: string
  voice_profile_id: string | null
  character_count: number
  cost_usd: number
  provider: string
  created_at: string
}

export interface TTSUsageSummary {
  charCount: number
  cost: number
  limit: number
}

export class TTSQuotaExceeded extends Error {
  constructor(used: number, limit: number) {
    super(`TTS daily quota exceeded: ${used}/${limit} characters used`)
    this.name = 'TTSQuotaExceeded'
  }
}

export class VoiceCloneFailed extends Error {
  constructor(reason: string) {
    super(`Voice clone failed: ${reason}`)
    this.name = 'VoiceCloneFailed'
  }
}

export class TTSServiceUnavailable extends Error {
  constructor(provider: string, cause?: string) {
    super(`TTS service unavailable (${provider})${cause ? ': ' + cause : ''}`)
    this.name = 'TTSServiceUnavailable'
  }
}
