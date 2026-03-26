'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { synthesizeSpeech, getVoiceProfiles } from '@/lib/voice-engine'
import type { VoiceProfile } from '@/lib/voice-engine-types'
import type { User } from '@/lib/types'
import Link from 'next/link'
import {
  fetchLibriVoxBooks,
  fetchRadioStations,
  searchPodcasts,
  getMeditationScripts,
  getWellnessArticles,
  type AudioContent,
} from '@/lib/content-sources'

type Category = 'wellness' | 'stories' | 'meditation' | 'exercise' | 'radio'

interface ContentItem {
  id: string
  category: Category
  emoji: string
  title: string
  duration: string
  type: 'tts' | 'audio' | 'stream'
  text?: string // for TTS content
  audioUrl?: string // for pre-recorded audio or stream URL
}

// Map AudioContent from APIs to the internal ContentItem format
function mapApiContent(items: AudioContent[], categoryOverride?: Category): ContentItem[] {
  return items.map(item => {
    let category: Category = categoryOverride || (item.category as Category)
    // Normalise audiobook -> stories for the UI tab
    if (category === ('audiobook' as string)) category = 'stories'

    let emoji = '🌿'
    switch (category) {
      case 'wellness': emoji = '🌿'; break
      case 'stories': emoji = '📖'; break
      case 'meditation': emoji = '🧘'; break
      case 'exercise': emoji = '🤸'; break
      case 'radio': emoji = '📻'; break
    }

    const type: ContentItem['type'] = item.text_content
      ? 'tts'
      : category === 'radio'
        ? 'stream'
        : 'audio'

    const mins = item.duration_seconds > 0
      ? `${Math.round(item.duration_seconds / 60)} min`
      : category === 'radio' ? 'Live' : ''

    return {
      id: item.id,
      category,
      emoji,
      title: item.title,
      duration: mins,
      type,
      text: item.text_content,
      audioUrl: item.audio_url,
    }
  })
}

// Hardcoded fallback content so the page is never empty
const FALLBACK_CONTENT: ContentItem[] = [
  {
    id: 's1', category: 'stories', emoji: '📖',
    title: 'Pride and Prejudice - Chapter 1', duration: '12 min', type: 'audio',
    audioUrl: 'https://ia800204.us.archive.org/0/items/pride_and_prejudice_0711_librivox/prideandprejudice_01_austen_64kb.mp3',
  },
  {
    id: 's2', category: 'stories', emoji: '📖',
    title: 'A Christmas Carol - Stave 1', duration: '25 min', type: 'audio',
    audioUrl: 'https://ia601409.us.archive.org/35/items/christmascarol_0711_librivox/christmascarol_1_dickens_64kb.mp3',
  },
  {
    id: 's3', category: 'stories', emoji: '📖',
    title: 'The Adventures of Sherlock Holmes - Ch 1', duration: '30 min', type: 'audio',
    audioUrl: 'https://ia902609.us.archive.org/24/items/adventures_holmes_0711_librivox/adventuresofsherlockholmes_01_doyle_64kb.mp3',
  },
  {
    id: 'r1', category: 'radio', emoji: '📻',
    title: 'NPR News Live', duration: 'Live', type: 'stream',
    audioUrl: 'https://npr-ice.streamguys1.com/live.mp3',
  },
  {
    id: 'r2', category: 'radio', emoji: '🌍',
    title: 'BBC World Service', duration: 'Live', type: 'stream',
    audioUrl: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service',
  },
]

const CATEGORIES: { key: Category; label: string; emoji: string }[] = [
  { key: 'wellness', label: 'Wellness', emoji: '🌿' },
  { key: 'stories', label: 'Stories', emoji: '📖' },
  { key: 'meditation', label: 'Meditation', emoji: '🧘' },
  { key: 'exercise', label: 'Exercise', emoji: '🤸' },
  { key: 'radio', label: 'Radio', emoji: '📻' },
]

function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

// Skeleton card shown while content loads
function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-[40px] h-[40px] rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-5 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-1/4" />
        </div>
        <div className="w-[64px] h-[64px] rounded-full bg-gray-200 flex-shrink-0" />
      </div>
    </div>
  )
}

export default function ListenPage() {
  const supabase = createClient()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<Category>('wellness')
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([])
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null)

  // All fetched content, cached in state
  const [allContent, setAllContent] = useState<ContentItem[]>([])

  // Playing state
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [playingUrl, setPlayingUrl] = useState<string | null>(null)
  const [playingTitle, setPlayingTitle] = useState<string | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [synthError, setSynthError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Sync audioRef with playingUrl so parent can control play/pause
  useEffect(() => {
    if (!playingUrl) {
      audioRef.current = null
      return
    }
    const audio = new Audio(playingUrl)
    audioRef.current = audio
    audio.play().catch(() => {})
    audio.addEventListener('ended', () => {
      setPlayingId(null)
      setPlayingUrl(null)
      setPlayingTitle(null)
      setIsPaused(false)
    })
    audio.addEventListener('pause', () => {
      setIsPaused(true)
    })
    audio.addEventListener('play', () => {
      setIsPaused(false)
    })
    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [playingUrl])

  // Fetch user & voice profiles
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

  // Fetch content from APIs (runs once)
  useEffect(() => {
    let cancelled = false

    async function loadContent() {
      setContentLoading(true)

      // Start with local content (always available)
      const localMeditations = mapApiContent(getMeditationScripts())
      const localWellness = mapApiContent(getWellnessArticles())
      const localItems = [...localMeditations, ...localWellness, ...FALLBACK_CONTENT]

      // Set local content immediately so the page is usable
      if (!cancelled) setAllContent(localItems)

      // Fetch remote APIs in parallel, each with its own error handling
      const results = await Promise.allSettled([
        fetchLibriVoxBooks(15),
        fetchRadioStations('US', 15),
        searchPodcasts('senior wellness', 15),
      ])

      if (cancelled) return

      const apiItems: ContentItem[] = []

      // LibriVox audiobooks -> stories tab
      if (results[0].status === 'fulfilled') {
        apiItems.push(...mapApiContent(results[0].value))
      } else {
        console.warn('LibriVox fetch failed:', results[0].reason)
      }

      // Radio stations -> radio tab
      if (results[1].status === 'fulfilled') {
        apiItems.push(...mapApiContent(results[1].value))
      } else {
        console.warn('Radio Browser fetch failed:', results[1].reason)
      }

      // Podcasts -> wellness tab
      if (results[2].status === 'fulfilled') {
        apiItems.push(...mapApiContent(results[2].value, 'wellness'))
      } else {
        console.warn('iTunes Podcast fetch failed:', results[2].reason)
      }

      // Merge: local first, then API content. Remove fallback duplicates if API succeeded.
      const hasApiStories = apiItems.some(i => i.category === 'stories')
      const hasApiRadio = apiItems.some(i => i.category === 'radio')

      const merged = [
        ...localMeditations,
        ...localWellness,
        // Keep fallback stories only if LibriVox failed
        ...(hasApiStories ? [] : FALLBACK_CONTENT.filter(f => f.category === 'stories')),
        // Keep fallback radio only if Radio Browser failed
        ...(hasApiRadio ? [] : FALLBACK_CONTENT.filter(f => f.category === 'radio')),
        ...apiItems,
      ]

      if (!cancelled) {
        setAllContent(merged)
        setContentLoading(false)
      }
    }

    loadContent()
    return () => { cancelled = true }
  }, [])

  const handlePlay = useCallback(async (item: ContentItem) => {
    setSynthError(null)

    // If tapping the same item, toggle pause/play
    if (playingId === item.id) {
      if (audioRef.current) {
        if (audioRef.current.paused) {
          audioRef.current.play()
          setIsPaused(false)
        } else {
          audioRef.current.pause()
          setIsPaused(true)
        }
      }
      // Also handle browser speech synthesis pause/resume
      if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume()
          setIsPaused(false)
        } else {
          window.speechSynthesis.pause()
          setIsPaused(true)
        }
      }
      return
    }

    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    setPlayingId(item.id)
    setPlayingTitle(item.title)
    setIsPaused(false)

    if (item.type === 'audio' || item.type === 'stream') {
      // Direct audio URL
      setPlayingUrl(item.audioUrl || null)
    } else if (item.type === 'tts' && item.text) {
      // Synthesize with voice engine
      setIsSynthesizing(true)
      try {
        const result = await synthesizeSpeech(item.text, selectedVoiceId || undefined)
        setPlayingUrl(result.audioUrl)

        // If browser TTS returned empty URL, the speech is playing directly
        if (!result.audioUrl) {
          setIsSynthesizing(false)
          return
        }
      } catch (err) {
        console.error('TTS failed:', err)
        setSynthError('Could not generate audio. Please try again.')
        setPlayingId(null)
        setPlayingTitle(null)
      }
      setIsSynthesizing(false)
    }
  }, [playingId, selectedVoiceId])

  const handleStop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    // Also cancel browser speech synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setPlayingId(null)
    setPlayingUrl(null)
    setPlayingTitle(null)
    setIsPaused(false)
  }, [])

  // Toggle play/pause from the Now Playing bar
  const handleNowPlayingToggle = useCallback(() => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play()
        setIsPaused(false)
      } else {
        audioRef.current.pause()
        setIsPaused(true)
      }
    }
  }, [])

  const filteredContent = allContent.filter(item => item.category === activeCategory)

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
    <div className="min-h-screen bg-[#FFF8F0] pb-40">
      <div className="max-w-lg mx-auto px-5 pt-8 space-y-6">

        {/* Greeting */}
        <div className="text-center">
          <h1 className="text-[32px] font-bold text-gray-900 leading-tight">
            Good {getTimeOfDay()}, {currentUser.name}
          </h1>
          {voiceProfiles.length > 0 && (
            <p className="text-[20px] text-[#4ECDC4] mt-2">
              Playing with: {voiceProfiles.find(p => p.id === selectedVoiceId)?.name || 'System voice'}
            </p>
          )}
        </div>

        {/* Voice selector (if profiles available) */}
        {voiceProfiles.length > 0 && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-orange-100">
            <label className="text-[18px] font-medium text-gray-700 block mb-2">
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
        )}

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex-shrink-0 px-6 py-4 rounded-full text-[18px] font-bold transition-colors min-h-[56px] ${
                activeCategory === cat.key
                  ? 'bg-[#FF6B35] text-white shadow-md'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-[#FF6B35]'
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {synthError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-[18px] text-red-600">{synthError}</p>
          </div>
        )}

        {/* Content cards */}
        <div className="space-y-4">
          {contentLoading && filteredContent.length === 0 ? (
            // Show skeleton cards while loading
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : filteredContent.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[20px] text-gray-400">No content available for this category yet.</p>
            </div>
          ) : (
            filteredContent.map(item => (
              <div
                key={item.id}
                className={`bg-white rounded-3xl p-6 shadow-sm border transition-colors ${
                  playingId === item.id
                    ? 'border-[#FF6B35] bg-orange-50'
                    : 'border-orange-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Emoji icon */}
                  <div className="text-[40px] flex-shrink-0">{item.emoji}</div>

                  {/* Title + duration */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[22px] font-semibold text-gray-900 leading-tight">
                      {item.title}
                    </p>
                    <p className="text-[18px] text-gray-500 mt-1">
                      {item.duration}
                    </p>
                  </div>

                  {/* Play/Pause button */}
                  <button
                    onClick={() => handlePlay(item)}
                    disabled={isSynthesizing && playingId !== item.id}
                    className={`w-[64px] h-[64px] flex-shrink-0 flex items-center justify-center rounded-full transition-colors shadow-md ${
                      playingId === item.id
                        ? 'bg-[#4ECDC4] hover:bg-[#38b2ac]'
                        : 'bg-[#FF6B35] hover:bg-[#e55a2b]'
                    } text-white disabled:opacity-50`}
                  >
                    {isSynthesizing && playingId === item.id ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                    ) : playingId === item.id && !isPaused ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                      </svg>
                    ) : (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                        <polygon points="6,3 20,12 6,21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Show loading indicator below existing content if still fetching */}
          {contentLoading && filteredContent.length > 0 && (
            <div className="text-center py-4">
              <p className="text-[16px] text-gray-400 animate-pulse">Loading more content...</p>
            </div>
          )}
        </div>

        {/* "Read to Me" link */}
        <Link
          href="/dashboard/parent/read-aloud"
          className="block bg-gradient-to-br from-[#4ECDC4] to-[#38b2ac] rounded-3xl p-6 shadow-lg text-center"
        >
          <div className="text-[40px] mb-2">📸</div>
          <p className="text-[24px] font-bold text-white">Read to Me</p>
          <p className="text-[18px] text-white/80 mt-1">
            Take a photo of any text and hear it read aloud
          </p>
        </Link>
      </div>

      {/* Now Playing Bar */}
      {playingId && (
        <div className="fixed bottom-20 left-0 right-0 bg-white border-t-2 border-[#FF6B35] shadow-lg z-50">
          <div className="max-w-lg mx-auto px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FF6B35] flex items-center justify-center flex-shrink-0">
                {isPaused ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <polygon points="6,3 20,12 6,21" />
                  </svg>
                ) : (
                  <div className="flex gap-[3px]">
                    <div className="w-[3px] h-[14px] bg-white rounded-sm animate-pulse" />
                    <div className="w-[3px] h-[14px] bg-white rounded-sm animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-[3px] h-[14px] bg-white rounded-sm animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-semibold text-gray-800 truncate">{playingTitle}</p>
                <p className="text-[13px] text-gray-400">
                  {isSynthesizing ? 'Generating audio...' : isPaused ? 'Paused' : 'Now Playing'}
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-3">
              {playingUrl && (
                <button
                  onClick={handleNowPlayingToggle}
                  className="flex-1 py-3 rounded-2xl bg-[#FF6B35] text-[18px] font-bold text-white hover:bg-[#e55a2b] transition-colors min-h-[48px] flex items-center justify-center gap-2"
                >
                  {isPaused ? (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <polygon points="6,3 20,12 6,21" />
                      </svg>
                      Resume
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                      </svg>
                      Pause
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleStop}
                className={`${playingUrl ? '' : 'flex-1'} py-3 px-6 rounded-2xl bg-gray-100 text-[18px] font-bold text-gray-600 hover:bg-gray-200 transition-colors min-h-[48px]`}
              >
                Stop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
