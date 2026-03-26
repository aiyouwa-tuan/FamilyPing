'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface AudioPlayerProps {
  audioUrl?: string
  title?: string
  voiceProfileId?: string
  onComplete?: () => void
}

export default function AudioPlayer({
  audioUrl,
  title,
  onComplete,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration)
      setIsLoaded(true)
    })

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime)
    })

    audio.addEventListener('ended', () => {
      setIsPlaying(false)
      setCurrentTime(0)
      onComplete?.()
    })

    audio.addEventListener('error', () => {
      setIsPlaying(false)
      setIsLoaded(false)
    })

    if (audioUrl) {
      audio.src = audioUrl
      audio.load()
    }

    return () => {
      audio.pause()
      audio.removeEventListener('loadedmetadata', () => {})
      audio.removeEventListener('timeupdate', () => {})
      audio.removeEventListener('ended', () => {})
      audio.removeEventListener('error', () => {})
      audio.src = ''
    }
  }, [audioUrl, onComplete])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate
    }
  }, [playbackRate])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      try {
        await audio.play()
        setIsPlaying(true)
      } catch (err) {
        console.error('Playback failed:', err)
      }
    }
  }, [isPlaying, audioUrl])

  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, audio.duration || 0))
  }, [])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    const bar = progressRef.current
    if (!audio || !bar || !duration) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audio.currentTime = ratio * duration
  }, [duration])

  const cycleSpeed = useCallback(() => {
    const speeds = [0.75, 1, 1.25, 1.5]
    const idx = speeds.indexOf(playbackRate)
    const next = speeds[(idx + 1) % speeds.length]
    setPlaybackRate(next)
  }, [playbackRate])

  function formatTime(s: number): string {
    if (!isFinite(s) || s < 0) return '0:00'
    const mins = Math.floor(s / 60)
    const secs = Math.floor(s % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-orange-100">
      {/* Title */}
      {title && (
        <p className="text-[18px] font-semibold text-gray-800 mb-4 truncate">{title}</p>
      )}

      {/* Progress bar */}
      <div
        ref={progressRef}
        onClick={handleProgressClick}
        className="w-full h-3 bg-gray-200 rounded-full cursor-pointer mb-3 relative overflow-hidden"
      >
        <div
          className="h-full bg-[#FF6B35] rounded-full transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Time display */}
      <div className="flex justify-between text-[14px] text-gray-500 mb-4">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {/* Volume */}
        <div className="relative">
          <button
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            className="w-[48px] h-[48px] flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-[20px]"
            aria-label="Volume"
          >
            {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
          </button>
          {showVolumeSlider && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 p-3 w-[48px]">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-[80px] -rotate-90 translate-y-[16px] accent-[#FF6B35]"
              />
            </div>
          )}
        </div>

        {/* Skip back 15s */}
        <button
          onClick={() => skip(-15)}
          className="w-[52px] h-[52px] flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Skip back 15 seconds"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 17l-5-5 5-5" />
            <text x="13" y="16" fill="#555" fontSize="9" fontFamily="sans-serif" stroke="none">15</text>
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          disabled={!audioUrl || !isLoaded}
          className="w-[64px] h-[64px] flex items-center justify-center rounded-full bg-[#FF6B35] hover:bg-[#e55a2b] disabled:bg-gray-300 transition-colors shadow-lg shadow-[#FF6B35]/30 text-white"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <polygon points="6,3 20,12 6,21" />
            </svg>
          )}
        </button>

        {/* Skip forward 15s */}
        <button
          onClick={() => skip(15)}
          className="w-[52px] h-[52px] flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Skip forward 15 seconds"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 17l5-5-5-5" />
            <text x="2" y="16" fill="#555" fontSize="9" fontFamily="sans-serif" stroke="none">15</text>
          </svg>
        </button>

        {/* Speed */}
        <button
          onClick={cycleSpeed}
          className="w-[52px] h-[52px] flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-[14px] font-bold text-gray-700"
          aria-label={`Playback speed ${playbackRate}x`}
        >
          {playbackRate}x
        </button>
      </div>
    </div>
  )
}
