'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { synthesizeSpeech, getVoiceProfiles } from '@/lib/voice-engine'
import type { VoiceProfile } from '@/lib/voice-engine-types'
import type { User } from '@/lib/types'
import Link from 'next/link'
import AudioPlayer from '@/components/AudioPlayer'

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

const SEED_CONTENT: ContentItem[] = [
  // Wellness articles (TTS)
  {
    id: 'w1',
    category: 'wellness',
    emoji: '🌿',
    title: 'Five Ways to Start Your Morning Right',
    duration: '3 min',
    type: 'tts',
    text: 'Starting your morning with intention can transform your entire day. First, take a few deep breaths before getting out of bed. Second, drink a full glass of water to hydrate after sleep. Third, spend five minutes stretching gently to wake up your body. Fourth, eat a nourishing breakfast with protein and whole grains. And fifth, take a moment to think of one thing you are grateful for. These simple habits can help you feel more energized, focused, and positive throughout the day.',
  },
  {
    id: 'w2',
    category: 'wellness',
    emoji: '💧',
    title: 'Why Staying Hydrated Matters',
    duration: '2 min',
    type: 'tts',
    text: 'Water is essential for every function in your body. It helps regulate your temperature, cushion your joints, and carry nutrients to your cells. As we get older, our sense of thirst can diminish, so it is important to drink water regularly even when you do not feel thirsty. Aim for six to eight glasses a day. You can also get water from fruits like watermelon and oranges, soups, and herbal teas. Keeping a water bottle nearby is a simple reminder to sip throughout the day.',
  },
  {
    id: 'w3',
    category: 'wellness',
    emoji: '😴',
    title: 'Tips for Better Sleep',
    duration: '3 min',
    type: 'tts',
    text: 'Good sleep is one of the most important things you can do for your health. Try to go to bed and wake up at the same time every day, even on weekends. Keep your bedroom cool, dark, and quiet. Avoid screens for at least thirty minutes before bed. Instead, try reading a book or listening to calming music. A warm cup of chamomile tea can also help you relax. If you find yourself lying awake, do not worry. Get up, do something quiet, and return to bed when you feel sleepy.',
  },
  {
    id: 'w4',
    category: 'wellness',
    emoji: '🧠',
    title: 'Keeping Your Mind Sharp',
    duration: '3 min',
    type: 'tts',
    text: 'Just like your body, your brain needs regular exercise to stay healthy. Puzzles, crosswords, and word games are excellent ways to challenge your mind. Learning something new, whether it is a recipe, a craft, or a few words in another language, creates new connections in your brain. Social interaction is also vital. Talking with friends and family, sharing stories, and even playing card games all help keep your mind active and engaged. Remember, it is never too late to learn something new.',
  },
  {
    id: 'w5',
    category: 'wellness',
    emoji: '🫀',
    title: 'Heart Health at Every Age',
    duration: '3 min',
    type: 'tts',
    text: 'Taking care of your heart is a lifelong journey. Walking for thirty minutes a day can significantly improve your cardiovascular health. Choose foods rich in fiber, like oats, beans, and vegetables. Limit salt and processed foods when possible. Managing stress is also important for your heart. Deep breathing, spending time in nature, and connecting with loved ones all help reduce stress. If you take medication for blood pressure or cholesterol, take it consistently as prescribed. Your heart will thank you.',
  },
  // LibriVox audiobook chapters
  {
    id: 's1',
    category: 'stories',
    emoji: '📖',
    title: 'Pride and Prejudice - Chapter 1',
    duration: '12 min',
    type: 'audio',
    audioUrl: 'https://ia800204.us.archive.org/0/items/pride_and_prejudice_0711_librivox/prideandprejudice_01_austen_64kb.mp3',
  },
  {
    id: 's2',
    category: 'stories',
    emoji: '📖',
    title: 'A Christmas Carol - Stave 1',
    duration: '25 min',
    type: 'audio',
    audioUrl: 'https://ia601409.us.archive.org/35/items/christmascarol_0711_librivox/christmascarol_1_dickens_64kb.mp3',
  },
  {
    id: 's3',
    category: 'stories',
    emoji: '📖',
    title: 'The Adventures of Sherlock Holmes - Ch 1',
    duration: '30 min',
    type: 'audio',
    audioUrl: 'https://ia902609.us.archive.org/24/items/adventures_holmes_0711_librivox/adventuresofsherlockholmes_01_doyle_64kb.mp3',
  },
  {
    id: 's4',
    category: 'stories',
    emoji: '📖',
    title: 'Alice in Wonderland - Chapter 1',
    duration: '10 min',
    type: 'audio',
    audioUrl: 'https://ia800204.us.archive.org/29/items/aliceinwonderland_0711_librivox/wonderland_ch01_carroll_64kb.mp3',
  },
  {
    id: 's5',
    category: 'stories',
    emoji: '📖',
    title: 'The Wind in the Willows - Chapter 1',
    duration: '20 min',
    type: 'audio',
    audioUrl: 'https://ia903104.us.archive.org/13/items/wind_willows_0711_librivox/windinthewillows_01_grahame_64kb.mp3',
  },
  // Meditation scripts (TTS)
  {
    id: 'm1',
    category: 'meditation',
    emoji: '🧘',
    title: 'Morning Calm Meditation',
    duration: '5 min',
    type: 'tts',
    text: 'Find a comfortable position and gently close your eyes. Take a slow, deep breath in through your nose, filling your lungs completely. Hold for a moment, then slowly exhale through your mouth. With each breath, feel your body becoming more relaxed. Your shoulders are dropping. Your jaw is unclenching. Your hands are resting softly. Now imagine a warm, golden light surrounding you. This light is peaceful and protective. With each breath, the light grows brighter, filling you with calm energy. You are safe. You are at peace. You are loved. Continue breathing slowly for the next few minutes, letting this warm light carry away any worries or tension.',
  },
  {
    id: 'm2',
    category: 'meditation',
    emoji: '🌊',
    title: 'Ocean Waves Relaxation',
    duration: '5 min',
    type: 'tts',
    text: 'Close your eyes and imagine yourself on a beautiful, quiet beach. The sand beneath you is warm and soft. You can hear the gentle rhythm of waves rolling onto the shore. Breathe in with the waves as they come in. Breathe out as they pull back. In and out, like the tide. The sky above is a perfect blue, dotted with soft white clouds. A gentle breeze carries the scent of salt air. Feel the warmth of the sun on your skin. With each wave, feel your tension washing away. The ocean is vast and timeless, and in this moment, you are part of its peaceful rhythm.',
  },
  {
    id: 'm3',
    category: 'meditation',
    emoji: '🌸',
    title: 'Gratitude Garden Meditation',
    duration: '5 min',
    type: 'tts',
    text: 'Take a deep breath and let your mind wander to a beautiful garden. This is your gratitude garden. Every flower here represents something good in your life. Walk slowly along the path. See the red roses. They are the people who love you. Smell the lavender. That is the peace you find in quiet moments. Touch the soft petals of a daisy. That is a happy memory from your past. As you walk, think of three things you are grateful for today. Perhaps it is your health, a warm meal, or the sound of a loved one\'s voice. Plant each gratitude as a new seed in your garden. Watch them bloom. Your garden grows richer with every grateful thought.',
  },
  {
    id: 'm4',
    category: 'meditation',
    emoji: '🌙',
    title: 'Evening Wind-Down',
    duration: '5 min',
    type: 'tts',
    text: 'As the day comes to a close, give yourself permission to let go of everything that happened today. Find a comfortable spot, perhaps in your favorite chair or lying in bed. Close your eyes and take three slow, deep breaths. With the first breath, release any physical tension. With the second breath, let go of any worries. With the third breath, fill yourself with peace. Imagine the night sky above you, filled with stars. Each star is a moment of kindness you gave or received today. The day is done, and you did well. Tomorrow is a new beginning. For now, rest. You have earned this peaceful moment.',
  },
  {
    id: 'm5',
    category: 'meditation',
    emoji: '🌳',
    title: 'Forest Walk Visualization',
    duration: '5 min',
    type: 'tts',
    text: 'Imagine you are walking along a gentle forest path. Tall trees surround you, their leaves creating a canopy of green above. Sunlight filters through in golden patches. The air is fresh and cool. You can hear birds singing softly. With each step, feel the soft earth beneath your feet. A small stream runs alongside the path, its water sparkling and clear. Pause for a moment and listen to its gentle sound. This forest is a place of peace and renewal. Here, there is no rush. No schedule. Just the beauty of nature surrounding you. Take a deep breath of this pure forest air and feel renewed.',
  },
  // Chair Yoga exercises (TTS)
  {
    id: 'e1',
    category: 'exercise',
    emoji: '🪑',
    title: 'Gentle Chair Yoga - Upper Body',
    duration: '8 min',
    type: 'tts',
    text: 'Welcome to chair yoga. Sit comfortably in your chair with your feet flat on the floor. Let us begin with neck rolls. Slowly lower your chin to your chest, then gently roll your head to the right, back, left, and forward again. Do this three times in each direction. Next, shoulder shrugs. Raise both shoulders up toward your ears, hold for three seconds, then release. Repeat five times. Now, arm circles. Extend your arms out to the sides and make small circles forward, then backward. Ten in each direction. Finally, seated twist. Place your right hand on your left knee and gently twist to the left, looking over your left shoulder. Hold for fifteen seconds. Switch sides. Well done.',
  },
  {
    id: 'e2',
    category: 'exercise',
    emoji: '🦵',
    title: 'Gentle Chair Yoga - Lower Body',
    duration: '8 min',
    type: 'tts',
    text: 'Let us work on your lower body while seated. Start with ankle circles. Lift your right foot slightly off the floor and rotate your ankle clockwise ten times, then counterclockwise ten times. Switch to the left foot. Next, seated leg raises. Slowly extend your right leg out in front of you until it is straight. Hold for five seconds, then lower. Repeat ten times on each side. Now, seated marching. Lift your right knee up toward the ceiling, then lower it. Alternate with the left knee. Continue for thirty seconds at a comfortable pace. Finally, gentle calf raises. With both feet flat on the floor, raise your heels while keeping your toes on the ground. Hold for three seconds, then lower. Repeat ten times. Excellent work.',
  },
  {
    id: 'e3',
    category: 'exercise',
    emoji: '🤸',
    title: 'Morning Stretch Routine',
    duration: '6 min',
    type: 'tts',
    text: 'Good morning! Let us start with a gentle stretch routine. You can do this sitting or standing, whatever feels comfortable. First, reach both arms above your head and stretch tall, like you are trying to touch the ceiling. Hold for ten seconds. Next, interlace your fingers behind your back and gently squeeze your shoulder blades together, opening your chest. Hold for ten seconds. Now, place your right hand on the side of your head and gently tilt your head toward your right shoulder. Hold for ten seconds, then switch sides. Finally, with your arms at your sides, slowly roll your shoulders forward five times, then backward five times. Take a deep breath in and out. You are ready for a wonderful day.',
  },
  // Radio stations (stream)
  {
    id: 'r1',
    category: 'radio',
    emoji: '📻',
    title: 'NPR News Live',
    duration: 'Live',
    type: 'stream',
    audioUrl: 'https://npr-ice.streamguys1.com/live.mp3',
  },
  {
    id: 'r2',
    category: 'radio',
    emoji: '🌍',
    title: 'BBC World Service',
    duration: 'Live',
    type: 'stream',
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

export default function ListenPage() {
  const supabase = createClient()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<Category>('wellness')
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([])
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null)

  // Playing state
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [playingUrl, setPlayingUrl] = useState<string | null>(null)
  const [playingTitle, setPlayingTitle] = useState<string | null>(null)
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [synthError, setSynthError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)

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

  const handlePlay = useCallback(async (item: ContentItem) => {
    setSynthError(null)

    // If tapping the same item, toggle pause/play
    if (playingId === item.id) {
      if (audioRef.current) {
        if (audioRef.current.paused) {
          audioRef.current.play()
        } else {
          audioRef.current.pause()
        }
      }
      return
    }

    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }

    setPlayingId(item.id)
    setPlayingTitle(item.title)

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
  }, [])

  const filteredContent = SEED_CONTENT.filter(item => item.category === activeCategory)

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
          {filteredContent.map(item => (
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

                {/* Play button */}
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
                  ) : playingId === item.id ? (
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
          ))}
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
      {playingId && playingUrl && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#FF6B35] shadow-lg z-50">
          <div className="max-w-lg mx-auto px-5 py-4">
            <AudioPlayer
              audioUrl={playingUrl}
              title={playingTitle || undefined}
              onComplete={handleStop}
            />
            <button
              onClick={handleStop}
              className="w-full mt-3 py-3 rounded-2xl bg-gray-100 text-[18px] font-bold text-gray-600 hover:bg-gray-200 transition-colors min-h-[48px]"
            >
              Stop
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
