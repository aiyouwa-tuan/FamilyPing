'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { recognizeText, terminateOCR } from '@/lib/ocr'
import { synthesizeSpeech, getVoiceProfiles } from '@/lib/voice-engine'
import type { VoiceProfile } from '@/lib/voice-engine-types'
import type { User } from '@/lib/types'

type PageState = 'camera' | 'preview' | 'processing' | 'result'

const SPEED_OPTIONS = [
  { label: 'Slow', value: 0.75 },
  { label: 'Normal', value: 1 },
  { label: 'Fast', value: 1.25 },
]

export default function ReadAloudPage() {
  const supabase = createClient()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Page flow
  const [pageState, setPageState] = useState<PageState>('camera')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [recognizedText, setRecognizedText] = useState<string | null>(null)
  const [ocrError, setOcrError] = useState<string | null>(null)

  // Voice options
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([])
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null)
  const [speed, setSpeed] = useState(1)

  // Playback
  const [isReading, setIsReading] = useState(false)
  const [readError, setReadError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Camera
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
          const profiles = await getVoiceProfiles(userData.family_id)
          setVoiceProfiles(profiles.filter(p => p.status === 'ready'))
          if (profiles.length > 0 && profiles[0].status === 'ready') {
            setSelectedVoiceId(profiles[0].id)
          }
        } catch {
          // Voice profiles not available yet
        }
      }
      setLoading(false)
    }
    init()
  }, [supabase])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      terminateOCR().catch(() => {})
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (err) {
      console.error('Camera access failed:', err)
      setOcrError('Could not access camera. You can upload a photo instead.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/png')
    setCapturedImage(dataUrl)
    setPageState('preview')
    stopCamera()
  }, [stopCamera])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setCapturedImage(dataUrl)
      setPageState('preview')
      stopCamera()
    }
    reader.readAsDataURL(file)
  }, [stopCamera])

  const processImage = useCallback(async () => {
    if (!capturedImage) return
    setPageState('processing')
    setOcrError(null)

    try {
      const text = await recognizeText(capturedImage)
      setRecognizedText(text)
      setPageState('result')
    } catch (err) {
      console.error('OCR failed:', err)
      setOcrError(err instanceof Error ? err.message : 'Text recognition failed. Please try a clearer photo.')
      setPageState('preview')
    }
  }, [capturedImage])

  const handleReadAloud = useCallback(async () => {
    if (!recognizedText) return
    setIsReading(true)
    setReadError(null)

    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    try {
      const result = await synthesizeSpeech(recognizedText, selectedVoiceId || undefined)

      if (result.audioUrl) {
        const audio = new Audio(result.audioUrl)
        audio.playbackRate = speed
        audioRef.current = audio
        audio.onended = () => setIsReading(false)
        audio.onerror = () => {
          setIsReading(false)
          setReadError('Audio playback failed.')
        }
        await audio.play()
      } else {
        // Browser TTS fallback was used - already playing
        // Set a timeout for approximate read duration
        const estimatedDuration = (recognizedText.length / 150) * 60 * 1000 / speed
        setTimeout(() => setIsReading(false), estimatedDuration)
      }
    } catch (err) {
      console.error('Read aloud failed:', err)
      setReadError('Could not read aloud. Please try again.')
      setIsReading(false)
    }
  }, [recognizedText, selectedVoiceId, speed])

  const handleStopReading = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setIsReading(false)
  }, [])

  const handleRetake = useCallback(() => {
    setCapturedImage(null)
    setRecognizedText(null)
    setOcrError(null)
    setReadError(null)
    setPageState('camera')
    startCamera()
  }, [startCamera])

  // Start camera when on camera state
  useEffect(() => {
    if (pageState === 'camera') {
      startCamera()
    }
    return () => {
      if (pageState === 'camera') {
        stopCamera()
      }
    }
  }, [pageState, startCamera, stopCamera])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="animate-pulse text-[#FF6B35] text-[24px] font-bold">Loading...</div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center px-6">
        <p className="text-[24px] text-gray-500">User not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-24">
      <div className="max-w-lg mx-auto px-5 pt-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="text-[#FF6B35] text-[20px] font-medium min-h-[48px] min-w-[48px] flex items-center"
          >
            &larr; Back
          </button>
          <h1 className="text-[24px] font-bold text-gray-900">Read to Me</h1>
          <div className="w-[48px]" />
        </div>

        {/* Error display */}
        {ocrError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <p className="text-[20px] text-red-600">{ocrError}</p>
          </div>
        )}

        {/* STATE: Camera */}
        {pageState === 'camera' && (
          <div className="space-y-5">
            {/* Camera viewfinder */}
            <div className="bg-black rounded-3xl overflow-hidden aspect-[3/4] relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-4 border-white/30 rounded-3xl pointer-events-none" />
              <p className="absolute bottom-4 left-0 right-0 text-center text-white text-[20px] font-medium drop-shadow-lg">
                Point camera at text to read
              </p>
            </div>

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Capture button */}
            <button
              onClick={capturePhoto}
              className="w-full bg-[#FF6B35] text-white py-5 rounded-3xl font-bold text-[24px] shadow-lg shadow-[#FF6B35]/30 hover:bg-[#e55a2b] transition-colors min-h-[72px] active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <span className="text-[32px]">📸</span>
              Take Photo
            </button>

            {/* Upload alternative */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-gray-300 text-gray-700 py-4 rounded-2xl font-bold text-[20px] hover:bg-white transition-colors min-h-[64px]"
            >
              Or Upload a Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {/* STATE: Preview */}
        {pageState === 'preview' && capturedImage && (
          <div className="space-y-5">
            <div className="rounded-3xl overflow-hidden shadow-lg">
              <img
                src={capturedImage}
                alt="Captured text"
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleRetake}
                className="py-4 rounded-2xl font-bold text-[20px] border-2 border-gray-300 text-gray-700 hover:bg-white transition-colors min-h-[64px] active:scale-[0.98]"
              >
                Retake
              </button>
              <button
                onClick={processImage}
                className="py-4 rounded-2xl font-bold text-[20px] bg-[#FF6B35] text-white hover:bg-[#e55a2b] transition-colors min-h-[64px] active:scale-[0.98]"
              >
                Read Text
              </button>
            </div>
          </div>
        )}

        {/* STATE: Processing */}
        {pageState === 'processing' && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-orange-100 text-center space-y-5">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FF6B35] border-t-transparent mx-auto" />
            <h2 className="text-[24px] font-bold text-gray-900">Reading...</h2>
            <p className="text-[20px] text-gray-500">
              Recognizing text from your photo
            </p>
          </div>
        )}

        {/* STATE: Result */}
        {pageState === 'result' && recognizedText && (
          <div className="space-y-5">
            {/* Recognized text */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100">
              <h3 className="text-[20px] font-semibold text-[#FF6B35] mb-3">
                Recognized Text:
              </h3>
              <p className="text-[24px] text-gray-900 leading-relaxed whitespace-pre-wrap">
                {recognizedText}
              </p>
            </div>

            {/* Voice selector */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-orange-100">
              <label className="text-[20px] font-medium text-gray-700 block mb-3">
                Voice:
              </label>
              <select
                value={selectedVoiceId || ''}
                onChange={(e) => setSelectedVoiceId(e.target.value || null)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 text-[20px] text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#4ECDC4] min-h-[56px]"
              >
                <option value="">System Voice</option>
                {voiceProfiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Speed control */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-orange-100">
              <label className="text-[20px] font-medium text-gray-700 block mb-3">
                Speed:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {SPEED_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSpeed(opt.value)}
                    className={`py-4 rounded-2xl font-bold text-[20px] transition-colors min-h-[56px] ${
                      speed === opt.value
                        ? 'bg-[#4ECDC4] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Read error */}
            {readError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-[20px] text-red-600">{readError}</p>
              </div>
            )}

            {/* Read Aloud button */}
            {!isReading ? (
              <button
                onClick={handleReadAloud}
                className="w-full bg-[#FF6B35] text-white py-5 rounded-3xl font-bold text-[26px] shadow-lg shadow-[#FF6B35]/30 hover:bg-[#e55a2b] transition-colors min-h-[72px] active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <span className="text-[32px]">🔊</span>
                Read Aloud
              </button>
            ) : (
              <button
                onClick={handleStopReading}
                className="w-full bg-red-500 text-white py-5 rounded-3xl font-bold text-[26px] shadow-lg hover:bg-red-600 transition-colors min-h-[72px] active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <span className="text-[32px]">⏹️</span>
                Stop Reading
              </button>
            )}

            {/* Retake */}
            <button
              onClick={handleRetake}
              className="w-full border-2 border-gray-300 text-gray-700 py-4 rounded-2xl font-bold text-[20px] hover:bg-white transition-colors min-h-[64px]"
            >
              Take Another Photo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
