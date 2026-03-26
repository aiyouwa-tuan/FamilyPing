'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { createVoiceClone, getVoiceProfiles, deleteVoiceProfile } from '@/lib/voice-engine'
import type { VoiceProfile } from '@/lib/voice-engine-types'
import type { User } from '@/lib/types'

type Step = 'landing' | 'name' | 'recording' | 'preview' | 'processing' | 'success'

const RECORDING_SCRIPT = `Hello, this is my voice recording for FamilyPing. I want my family to know how much I care about them. Every morning when the sun rises, I think about the wonderful memories we have shared together. From holiday dinners to lazy Sunday afternoons, those moments mean the world to me. I hope this recording brings a smile to your face whenever you hear it. Remember, no matter how far apart we are, we are always connected by the love we share. Take care of yourself, eat well, get plenty of rest, and never forget that you are deeply loved. I am always just a phone call away, and my heart is always with you.`

export default function VoiceSetupPage() {
  const supabase = createClient()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Flow state
  const [step, setStep] = useState<Step>('landing')
  const [voiceName, setVoiceName] = useState('')

  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [qualityIndicator, setQualityIndicator] = useState<'quiet' | 'good' | 'loud'>('good')
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Profiles
  const [profiles, setProfiles] = useState<VoiceProfile[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Processing / success
  const [processingProgress, setProcessingProgress] = useState(0)
  const [sampleUrl, setSampleUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // Fetch user and profiles
  useEffect(() => {
    async function init() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        window.location.href = '/auth/login'
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .limit(1)
        .single()

      if (userData) {
        setCurrentUser(userData)
        try {
          const p = await getVoiceProfiles(userData.family_id)
          setProfiles(p)
        } catch {
          // API not ready yet - that's OK
        }
      }
      setLoading(false)
    }
    init()
  }, [supabase])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up audio analysis for volume visualization
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      // Start volume monitoring
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      function updateLevel() {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        const normalized = Math.min(avg / 128, 1)
        setAudioLevel(normalized)

        if (normalized < 0.05) setQualityIndicator('quiet')
        else if (normalized > 0.85) setQualityIndicator('loud')
        else setQualityIndicator('good')

        animFrameRef.current = requestAnimationFrame(updateLevel)
      }
      updateLevel()

      // Start MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
        setRecordedBlob(blob)
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        setStep('preview')

        // Cleanup stream
        stream.getTracks().forEach(t => t.stop())
        if (audioContextRef.current) {
          audioContextRef.current.close()
          audioContextRef.current = null
        }
      }

      mediaRecorder.start(250) // collect data every 250ms
      setIsRecording(true)
      setRecordingTime(0)

      // Timer
      const startTime = Date.now()
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        setRecordingTime(elapsed)
        if (elapsed >= 90) {
          // Auto-stop at 90 seconds
          stopRecording()
        }
      }, 200)
    } catch (err) {
      console.error('Failed to start recording:', err)
      setError('Could not access microphone. Please allow microphone permission and try again.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = 0
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }, [])

  const handleRecordAgain = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setRecordedBlob(null)
    setRecordingTime(0)
    setAudioLevel(0)
    setStep('recording')
  }, [previewUrl])

  const handleUseRecording = useCallback(async () => {
    if (!recordedBlob || !currentUser) return
    setStep('processing')
    setProcessingProgress(0)

    // Simulate processing progress
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return 95
        }
        return prev + Math.random() * 8
      })
    }, 2000)

    try {
      const profile = await createVoiceClone(
        recordedBlob,
        voiceName,
        currentUser.family_id,
      )

      clearInterval(progressInterval)
      setProcessingProgress(100)
      setSampleUrl(profile.audio_sample_url || null)
      setProfiles(prev => [...prev, profile])

      setTimeout(() => setStep('success'), 500)
    } catch (err) {
      clearInterval(progressInterval)
      console.error('Voice clone failed:', err)
      setError('Voice processing failed. Please try recording again.')
      setStep('preview')
    }
  }, [recordedBlob, currentUser, voiceName])

  const handleDeleteProfile = useCallback(async (id: string) => {
    setDeletingId(id)
    try {
      await deleteVoiceProfile(id)
      setProfiles(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      console.error('Delete failed:', err)
    }
    setDeletingId(null)
  }, [])

  const handleStartOver = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setStep('landing')
    setVoiceName('')
    setRecordedBlob(null)
    setPreviewUrl(null)
    setRecordingTime(0)
    setAudioLevel(0)
    setProcessingProgress(0)
    setSampleUrl(null)
    setError(null)
  }, [previewUrl])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6B35]" />
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center px-6">
        <p className="text-[18px] text-gray-500">User not found. Please sign up first.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-12">
      <div className="max-w-lg mx-auto px-5 pt-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="text-[#FF6B35] text-[16px] font-medium"
          >
            &larr; Back
          </button>
          <h1 className="text-[20px] font-bold text-gray-900">Voice Setup</h1>
          <div className="w-[48px]" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-[15px] text-red-600">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-[14px] text-red-500 underline mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* STEP: Landing */}
        {step === 'landing' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-7 shadow-sm border border-orange-100 text-center">
              <div className="text-[64px] mb-4">🎙️</div>
              <h2 className="text-[24px] font-bold text-gray-900 mb-3">
                Record Your Voice for Mom & Dad
              </h2>
              <p className="text-[16px] text-gray-600 leading-relaxed">
                Record a short voice sample and we will create a voice model that sounds like you.
                Your parents will hear content read in your familiar voice, making it feel like
                you are right there with them.
              </p>
              <button
                onClick={() => setStep('name')}
                className="mt-6 w-full bg-[#FF6B35] text-white py-4 rounded-2xl font-bold text-[18px] hover:bg-[#e55a2b] transition-colors min-h-[56px] active:scale-[0.98]"
              >
                Get Started
              </button>
            </div>

            {/* Existing voice profiles */}
            {profiles.length > 0 && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100">
                <h3 className="text-[18px] font-semibold text-gray-900 mb-4">
                  Voice Profiles ({profiles.length})
                </h3>
                <div className="space-y-3">
                  {profiles.map(profile => (
                    <div
                      key={profile.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#4ECDC4] rounded-full flex items-center justify-center text-white text-[16px]">
                          🎤
                        </div>
                        <div>
                          <p className="text-[16px] font-medium text-gray-900">{profile.name}</p>
                          <p className="text-[13px] text-gray-500">
                            {profile.status === 'ready' ? 'Ready' : profile.status === 'processing' ? 'Processing...' : 'Failed'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteProfile(profile.id)}
                        disabled={deletingId === profile.id}
                        className="text-[14px] text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                      >
                        {deletingId === profile.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP: Voice Name */}
        {step === 'name' && (
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-orange-100">
            <h2 className="text-[22px] font-bold text-gray-900 mb-2">Name Your Voice</h2>
            <p className="text-[15px] text-gray-500 mb-6">
              Give this voice profile a name so your family can identify it.
            </p>
            <input
              type="text"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              placeholder="e.g., Sarah's voice, Tommy's voice"
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent text-[18px] text-gray-900 placeholder:text-gray-400"
              maxLength={50}
              autoFocus
            />
            <button
              onClick={() => setStep('recording')}
              disabled={!voiceName.trim()}
              className="mt-5 w-full bg-[#FF6B35] text-white py-4 rounded-2xl font-bold text-[18px] hover:bg-[#e55a2b] transition-colors disabled:opacity-50 min-h-[56px] active:scale-[0.98]"
            >
              Continue to Recording
            </button>
          </div>
        )}

        {/* STEP: Recording */}
        {step === 'recording' && (
          <div className="space-y-5">
            {/* Script to read */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[20px]">📖</span>
                <h3 className="text-[16px] font-semibold text-[#FF6B35]">Read this aloud:</h3>
              </div>
              <p className="text-[16px] text-gray-700 leading-relaxed">
                {RECORDING_SCRIPT}
              </p>
            </div>

            {/* Audio visualization */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100">
              <div className="flex items-center justify-center gap-1 h-[60px] mb-4">
                {Array.from({ length: 20 }).map((_, i) => {
                  const barHeight = isRecording
                    ? Math.max(4, Math.random() * audioLevel * 60)
                    : 4
                  return (
                    <div
                      key={i}
                      className="w-[6px] rounded-full transition-all duration-100"
                      style={{
                        height: `${barHeight}px`,
                        backgroundColor: qualityIndicator === 'good'
                          ? '#4ECDC4'
                          : qualityIndicator === 'loud'
                            ? '#FF6B35'
                            : '#ccc',
                      }}
                    />
                  )
                })}
              </div>

              {/* Quality indicator */}
              <div className="text-center mb-4">
                {isRecording && (
                  <p className={`text-[14px] font-medium ${
                    qualityIndicator === 'good'
                      ? 'text-green-600'
                      : qualityIndicator === 'loud'
                        ? 'text-orange-600'
                        : 'text-gray-400'
                  }`}>
                    {qualityIndicator === 'good' && 'Good volume level'}
                    {qualityIndicator === 'quiet' && 'Too quiet - speak louder or move closer'}
                    {qualityIndicator === 'loud' && 'A bit loud - move back slightly'}
                  </p>
                )}
              </div>

              {/* Timer */}
              <div className="text-center mb-5">
                <p className="text-[36px] font-mono font-bold text-gray-900">
                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </p>
                <p className="text-[14px] text-gray-500">
                  {isRecording ? 'Recording... (aim for ~60 seconds)' : 'Press to start recording'}
                </p>
              </div>

              {/* Record button */}
              <div className="flex justify-center">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="w-[80px] h-[80px] bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/40 active:scale-95 transition-all"
                    aria-label="Start recording"
                  >
                    <div className="w-[28px] h-[28px] bg-white rounded-full" />
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="w-[80px] h-[80px] bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/40 active:scale-95 transition-all animate-pulse"
                    aria-label="Stop recording"
                  >
                    <div className="w-[24px] h-[24px] bg-white rounded-[4px]" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP: Preview */}
        {step === 'preview' && previewUrl && (
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-orange-100 space-y-5">
            <h2 className="text-[22px] font-bold text-gray-900 text-center">
              Listen to Your Recording
            </h2>
            <p className="text-[15px] text-gray-500 text-center">
              Duration: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </p>

            <audio
              src={previewUrl}
              controls
              className="w-full"
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleRecordAgain}
                className="py-4 rounded-2xl font-bold text-[16px] border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors min-h-[56px] active:scale-[0.98]"
              >
                Record Again
              </button>
              <button
                onClick={handleUseRecording}
                className="py-4 rounded-2xl font-bold text-[16px] bg-[#FF6B35] text-white hover:bg-[#e55a2b] transition-colors min-h-[56px] active:scale-[0.98]"
              >
                Use This
              </button>
            </div>
          </div>
        )}

        {/* STEP: Processing */}
        {step === 'processing' && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-orange-100 text-center space-y-6">
            <div className="text-[56px] animate-bounce">🧠</div>
            <h2 className="text-[22px] font-bold text-gray-900">
              Creating your voice model...
            </h2>
            <p className="text-[15px] text-gray-500">
              This typically takes about 2 minutes. Please do not close this page.
            </p>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF6B35] to-[#4ECDC4] rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(processingProgress, 100)}%` }}
              />
            </div>
            <p className="text-[14px] text-gray-400">
              {Math.round(processingProgress)}% complete
            </p>
          </div>
        )}

        {/* STEP: Success */}
        {step === 'success' && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-orange-100 text-center space-y-5">
            <div className="text-[56px]">🎉</div>
            <h2 className="text-[24px] font-bold text-gray-900">
              Voice Ready!
            </h2>
            <p className="text-[16px] text-gray-600">
              &quot;{voiceName}&quot; has been created. Your family can now hear content in your voice.
            </p>

            {sampleUrl && (
              <div className="bg-[#FFF8F0] rounded-2xl p-4">
                <p className="text-[14px] text-gray-500 mb-2">Listen to a sample:</p>
                <audio src={sampleUrl} controls className="w-full" />
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                onClick={handleStartOver}
                className="w-full bg-[#4ECDC4] text-white py-4 rounded-2xl font-bold text-[18px] hover:bg-[#38b2ac] transition-colors min-h-[56px] active:scale-[0.98]"
              >
                Record Another Voice
              </button>
              <button
                onClick={() => window.history.back()}
                className="w-full border-2 border-gray-300 text-gray-700 py-4 rounded-2xl font-bold text-[16px] hover:bg-gray-50 transition-colors min-h-[56px]"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
