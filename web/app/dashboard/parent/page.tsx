'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { getTodayQuestion } from '@/lib/questions'
import type { User, Message } from '@/lib/types'

interface WeatherData {
  temp: number
  description: string
  icon: string
}

interface VoiceProfile {
  id: string
  voice_name: string
  status: string
  provider_voice_id: string | null
}

const WEATHER_ICONS: Record<string, string> = {
  '01d': '\u2600\uFE0F', '01n': '\uD83C\uDF19',
  '02d': '\u26C5', '02n': '\uD83C\uDF19',
  '03d': '\u2601\uFE0F', '03n': '\u2601\uFE0F',
  '04d': '\uD83C\uDF25\uFE0F', '04n': '\uD83C\uDF25\uFE0F',
  '09d': '\uD83C\uDF27\uFE0F', '09n': '\uD83C\uDF27\uFE0F',
  '10d': '\uD83C\uDF26\uFE0F', '10n': '\uD83C\uDF27\uFE0F',
  '11d': '\u26C8\uFE0F', '11n': '\u26C8\uFE0F',
  '13d': '\uD83C\uDF28\uFE0F', '13n': '\uD83C\uDF28\uFE0F',
  '50d': '\uD83C\uDF2B\uFE0F', '50n': '\uD83C\uDF2B\uFE0F',
}

function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Morning'
  if (hour < 17) return 'Afternoon'
  return 'Evening'
}

function getTimeEmoji(): string {
  const hour = new Date().getHours()
  if (hour < 12) return '\uD83C\uDF1E'
  if (hour < 17) return '\u2600\uFE0F'
  return '\uD83C\uDF19'
}

export default function ParentDashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [latestMessage, setLatestMessage] = useState<Message | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [moodSelected, setMoodSelected] = useState<string | null>(null)
  const [checkinDone, setCheckinDone] = useState(false)
  const [questionAnswer, setQuestionAnswer] = useState('')
  const [answerSent, setAnswerSent] = useState(false)
  const [submittingAnswer, setSubmittingAnswer] = useState(false)
  const [sosActive, setSosActive] = useState(false)
  const [sosHolding, setSosHolding] = useState(false)
  const [sosProgress, setSosProgress] = useState(0)
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null)
  const [greetingAudioUrl, setGreetingAudioUrl] = useState<string | null>(null)
  const [playingGreeting, setPlayingGreeting] = useState(false)
  const [loading, setLoading] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const sosTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sosStartRef = useRef<number>(0)
  const router = useRouter()
  const supabase = createClient()

  const todayQuestion = getTodayQuestion()

  const fetchWeather = useCallback(async () => {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      })
      const { latitude, longitude } = pos.coords
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
      if (apiKey) {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=imperial&appid=${apiKey}`
        )
        if (res.ok) {
          const data = await res.json()
          setWeather({
            temp: Math.round(data.main.temp),
            description: data.weather[0].description,
            icon: data.weather[0].icon,
          })
          return
        }
      }
    } catch {
      // Fallback to mock weather
    }
    setWeather({ temp: 72, description: 'Partly cloudy', icon: '02d' })
  }, [])

  const fetchData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      router.push('/auth/login')
      return
    }

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .limit(1)
      .single()

    if (!userData) {
      setLoading(false)
      return
    }
    setCurrentUser(userData)

    // Check if already checked in today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const { data: todayCheckin } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', userData.id)
      .gte('created_at', todayStart.toISOString())
      .limit(1)
      .single()

    if (todayCheckin) {
      setCheckinDone(true)
      setMoodSelected(todayCheckin.mood)
      if (todayCheckin.answer) {
        setAnswerSent(true)
      }
    }

    // Get latest message from family
    const { data: msgData } = await supabase
      .from('messages')
      .select('*')
      .eq('family_id', userData.family_id)
      .neq('sender_id', userData.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (msgData) setLatestMessage(msgData)

    // Get voice profile for this family
    const { data: vpData } = await supabase
      .from('voice_profiles')
      .select('id, voice_name, status, provider_voice_id')
      .eq('family_id', userData.family_id)
      .eq('is_primary', true)
      .eq('status', 'ready')
      .limit(1)
      .single()

    if (vpData) {
      setVoiceProfile(vpData)
      const todayDate = new Date().toISOString().split('T')[0]
      const { data: greetingUrl } = supabase.storage
        .from('audio')
        .getPublicUrl(`tts-cache/${userData.family_id}/${todayDate}/morning-greeting.mp3`)
      if (greetingUrl?.publicUrl) {
        setGreetingAudioUrl(greetingUrl.publicUrl)
      }
    }

    setLoading(false)
  }, [supabase, router])

  useEffect(() => {
    fetchData()
    fetchWeather()
  }, [fetchData, fetchWeather])

  async function handleMoodSelect(mood: string) {
    if (!currentUser || checkinDone) return
    setMoodSelected(mood)
    setCheckinDone(true)

    await supabase.from('checkins').insert({
      user_id: currentUser.id,
      family_id: currentUser.family_id,
      mood,
      question: todayQuestion.text,
    })
  }

  async function handleSubmitAnswer(e: React.FormEvent) {
    e.preventDefault()
    if (!questionAnswer.trim() || !currentUser) return
    setSubmittingAnswer(true)

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    await supabase
      .from('checkins')
      .update({ answer: questionAnswer.trim() })
      .eq('user_id', currentUser.id)
      .gte('created_at', todayStart.toISOString())

    setAnswerSent(true)
    setSubmittingAnswer(false)
  }

  function handleSOSStart() {
    if (sosActive) return
    setSosHolding(true)
    setSosProgress(0)
    sosStartRef.current = Date.now()
    sosTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - sosStartRef.current
      const pct = Math.min((elapsed / 3000) * 100, 100)
      setSosProgress(pct)
      if (elapsed >= 3000) {
        clearInterval(sosTimerRef.current!)
        sosTimerRef.current = null
        triggerSOS()
      }
    }, 50)
  }

  function handleSOSEnd() {
    if (sosTimerRef.current) {
      clearInterval(sosTimerRef.current)
      sosTimerRef.current = null
    }
    setSosHolding(false)
    setSosProgress(0)
  }

  async function triggerSOS() {
    if (!currentUser) return
    setSosHolding(false)
    setSosActive(true)

    let lat: number | null = null
    let lng: number | null = null
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      })
      lat = pos.coords.latitude
      lng = pos.coords.longitude
    } catch {
      // location unavailable
    }

    await supabase.from('sos_events').insert({
      user_id: currentUser.id,
      family_id: currentUser.family_id,
      status: 'active',
      location_lat: lat,
      location_lng: lng,
    })
  }

  function handlePlayGreeting() {
    if (!greetingAudioUrl) return
    if (playingGreeting && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlayingGreeting(false)
      return
    }
    const audio = new Audio(greetingAudioUrl)
    audioRef.current = audio
    audio.onended = () => setPlayingGreeting(false)
    audio.onerror = () => setPlayingGreeting(false)
    audio.play()
    setPlayingGreeting(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[#FF6B35] text-[24px] font-bold">Loading...</div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-[22px]" style={{ color: '#5D4037' }}>User not found.</p>
          <p className="text-[20px] mt-2" style={{ color: '#8D7B6E' }}>Please sign up first.</p>
        </div>
      </div>
    )
  }

  const weatherEmoji = weather ? (WEATHER_ICONS[weather.icon] || '\u2600\uFE0F') : '\u2600\uFE0F'

  return (
    <div className="min-h-screen px-5 pt-6 pb-24">
      <div className="max-w-[500px] mx-auto space-y-5 fade-in-up">

        {/* Greeting + Weather — much larger and warmer */}
        <div className="text-center pt-2">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-[36px] font-bold leading-tight" style={{ color: '#2D2016' }}>
              {getTimeEmoji()} Good {getTimeOfDay()},
            </h1>
            {greetingAudioUrl && (
              <button
                onClick={handlePlayGreeting}
                className={`text-[24px] w-[48px] h-[48px] rounded-full flex items-center justify-center transition-all ${
                  playingGreeting
                    ? 'bg-[#FF6B35] text-white animate-pulse'
                    : 'bg-[#FFE8D6] text-[#FF6B35]'
                }`}
                aria-label={playingGreeting ? 'Stop greeting' : 'Play greeting'}
              >
                {'\uD83D\uDD0A'}
              </button>
            )}
          </div>
          <h2 className="text-[36px] font-bold" style={{ color: '#FF6B35' }}>{currentUser.name}</h2>
          <p className="text-[18px] mt-2" style={{ color: '#8D7B6E' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Weather Card — teal gradient with subtle pattern */}
        <div
          className="rounded-[24px] p-6 text-white relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #4ECDC4 0%, #38b2ac 100%)',
            boxShadow: '0 4px 16px rgba(78, 205, 196, 0.3)',
          }}
        >
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)' }} />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[16px] opacity-90 font-medium">Today&apos;s Weather</p>
              <p className="text-[44px] font-bold mt-1 leading-none">
                {weather ? `${weather.temp}\u00B0F` : '--'}
              </p>
              <p className="text-[18px] opacity-90 mt-2 capitalize">
                {weather?.description || 'Loading...'}
              </p>
            </div>
            <div className="text-[64px] leading-none">{weatherEmoji}</div>
          </div>
        </div>

        <div className="warm-divider" />

        {/* Mood Check-in — larger buttons with gradient */}
        <div className="mobile-card">
          <h3 className="text-[24px] font-bold text-center mb-5" style={{ color: '#2D2016' }}>
            How are you feeling today?
          </h3>
          {checkinDone ? (
            <div className="text-center py-3">
              <p className="text-[24px] font-medium text-[#34C759]">
                Thanks for checking in!
              </p>
              <p className="text-[18px] mt-2" style={{ color: '#8D7B6E' }}>
                You selected: {moodSelected === 'great' ? 'Great' : moodSelected === 'ok' ? 'OK' : 'Not great'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => handleMoodSelect('great')}
                className="touch-button border-2 border-[#34C759] gap-4 mood-bounce"
                style={{ background: 'linear-gradient(135deg, #F0FFF4, #E8F5E9)', color: '#34C759' }}
              >
                <span className="text-[48px] leading-none">{'\uD83D\uDE0A'}</span>
                <span className="text-[24px] font-bold">Great</span>
              </button>
              <button
                onClick={() => handleMoodSelect('ok')}
                className="touch-button border-2 border-[#FF9F0A] gap-4 mood-bounce"
                style={{ background: 'linear-gradient(135deg, #FFFDF0, #FFF8E1)', color: '#FF9F0A' }}
              >
                <span className="text-[48px] leading-none">{'\uD83D\uDE10'}</span>
                <span className="text-[24px] font-bold">OK</span>
              </button>
              <button
                onClick={() => handleMoodSelect('not_great')}
                className="touch-button border-2 border-[#FF453A] gap-4 mood-bounce"
                style={{ background: 'linear-gradient(135deg, #FFF5F5, #FFEBEE)', color: '#FF453A' }}
              >
                <span className="text-[48px] leading-none">{'\uD83D\uDE14'}</span>
                <span className="text-[24px] font-bold">Not Great</span>
              </button>
            </div>
          )}
        </div>

        {/* Daily Question (shows after check-in) */}
        {checkinDone && (
          <div className="mobile-card">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[22px]">{'\uD83D\uDCAC'}</span>
              <h3 className="text-[18px] font-semibold text-[#FF6B35]">
                Today&apos;s Question
              </h3>
            </div>
            <p className="text-[20px] font-medium mb-4 leading-relaxed" style={{ color: '#2D2016' }}>
              {todayQuestion.text}
            </p>
            {answerSent ? (
              <p className="text-[18px] text-[#34C759] font-medium">
                Thanks for sharing! Your family will love reading this.
              </p>
            ) : (
              <form onSubmit={handleSubmitAnswer} className="space-y-4">
                <textarea
                  value={questionAnswer}
                  onChange={(e) => setQuestionAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={3}
                  className="w-full px-4 py-4 rounded-[20px] border-2 border-[rgba(255,107,53,0.15)] focus:outline-none focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent text-[18px] text-[#2D2016] placeholder:text-[#8D7B6E] resize-none bg-[#FFF5EE]"
                />
                <button
                  type="submit"
                  disabled={submittingAnswer || !questionAnswer.trim()}
                  className="touch-button text-white text-[20px] disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #4ECDC4, #7EDDD6)' }}
                >
                  {submittingAnswer ? 'Sending...' : 'Send Answer'}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="warm-divider" />

        {/* Listen Card — warm gradient */}
        <div
          className="rounded-[24px] p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #FF6B35 0%, #FF8F65 50%, #FFB088 100%)',
            boxShadow: '0 4px 16px rgba(255, 107, 53, 0.25)',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[40px]">{'\uD83C\uDFA7'}</span>
            <h3 className="text-[22px] font-bold text-white">Listen</h3>
          </div>
          <p className="text-[16px] text-white/85 mb-5 leading-relaxed">
            {voiceProfile
              ? `Hear stories in ${voiceProfile.voice_name}'s voice`
              : 'Ask your family to set up a voice for you'}
          </p>
          <Link
            href="/dashboard/parent/listen"
            className="touch-button bg-white text-[#FF6B35] text-[20px] font-bold"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          >
            {'\u25B6'} Play Something
          </Link>
          <Link
            href="/dashboard/parent/read-aloud"
            className="block text-center mt-3 text-[16px] text-white/90 font-medium min-h-[44px] flex items-center justify-center"
          >
            {'\uD83D\uDCD6'} Read Aloud
          </Link>
        </div>

        {/* Latest Message from Family */}
        <div className="mobile-card">
          <h3 className="text-[18px] font-semibold text-[#FF6B35] mb-3">
            {'\uD83D\uDC8C'} Message from Family
          </h3>
          {latestMessage ? (
            <div className="bg-[#FFF5EE] rounded-[16px] p-4">
              <p className="text-[18px] leading-relaxed" style={{ color: '#2D2016' }}>{latestMessage.content}</p>
              <p className="text-[14px] mt-2" style={{ color: '#8D7B6E' }}>
                {new Date(latestMessage.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
          ) : (
            <p className="text-[16px]" style={{ color: '#8D7B6E' }}>No messages yet</p>
          )}
        </div>

        <div className="warm-divider" />

        {/* Tool Cards — warmer with colored left accents */}
        <div className="space-y-3">
          <Link
            href="/dashboard/parent/phonebook"
            className="mobile-card flex items-center gap-4 !py-5 relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#4ECDC4] rounded-l-[20px]" />
            <span className="text-[36px]">{'\uD83D\uDCDE'}</span>
            <div className="flex-1">
              <p className="text-[18px] font-bold" style={{ color: '#2D2016' }}>Phonebook</p>
              <p className="text-[14px]" style={{ color: '#8D7B6E' }}>Call your contacts</p>
            </div>
            <span className="text-[20px] text-[#8D7B6E]">{'\u203A'}</span>
          </Link>
          <Link
            href="/dashboard/parent/medical-card"
            className="mobile-card flex items-center gap-4 !py-5 relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF6B35] rounded-l-[20px]" />
            <span className="text-[36px]">{'\uD83C\uDFE5'}</span>
            <div className="flex-1">
              <p className="text-[18px] font-bold" style={{ color: '#2D2016' }}>Medical Card</p>
              <p className="text-[14px]" style={{ color: '#8D7B6E' }}>Your medical info</p>
            </div>
            <span className="text-[20px] text-[#8D7B6E]">{'\u203A'}</span>
          </Link>
          <Link
            href="/dashboard/parent/mood-diary"
            className="mobile-card flex items-center gap-4 !py-5 relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFD166] rounded-l-[20px]" />
            <span className="text-[36px]">{'\uD83D\uDCD6'}</span>
            <div className="flex-1">
              <p className="text-[18px] font-bold" style={{ color: '#2D2016' }}>Mood Diary</p>
              <p className="text-[14px]" style={{ color: '#8D7B6E' }}>Track how you feel</p>
            </div>
            <span className="text-[20px] text-[#8D7B6E]">{'\u203A'}</span>
          </Link>
          <Link
            href="/dashboard/parent/watch"
            className="mobile-card flex items-center gap-4 !py-5 relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#7E57C2] rounded-l-[20px]" />
            <span className="text-[36px]">{'\uD83D\uDCFA'}</span>
            <div className="flex-1">
              <p className="text-[18px] font-bold" style={{ color: '#2D2016' }}>Watch</p>
              <p className="text-[14px]" style={{ color: '#8D7B6E' }}>Videos for you</p>
            </div>
            <span className="text-[20px] text-[#8D7B6E]">{'\u203A'}</span>
          </Link>
        </div>

        {/* Bottom spacer for SOS button */}
        <div className="h-[80px]" />
      </div>

      {/* Fixed SOS Button - above tab bar, with pulsing glow */}
      <div className="sos-button-container">
        {sosActive ? (
          <div className="bg-red-50 border-2 border-red-300 rounded-[20px] p-5 text-center" style={{ boxShadow: '0 4px 16px rgba(255, 59, 48, 0.25)' }}>
            <p className="text-[24px] font-bold text-red-600">SOS Alert Sent!</p>
            <p className="text-[16px] text-red-500 mt-1">
              Your family has been notified.
            </p>
          </div>
        ) : (
          <button
            onMouseDown={handleSOSStart}
            onMouseUp={handleSOSEnd}
            onMouseLeave={handleSOSEnd}
            onTouchStart={handleSOSStart}
            onTouchEnd={handleSOSEnd}
            onTouchCancel={handleSOSEnd}
            className="w-full bg-[#FF3B30] text-white py-4 rounded-full font-bold text-[22px] min-h-[64px] relative overflow-hidden select-none sos-glow"
            style={{ boxShadow: '0 4px 16px rgba(255, 59, 48, 0.4)' }}
          >
            {/* Progress overlay */}
            {sosHolding && (
              <div
                className="absolute inset-0 bg-[#CC2D25] transition-none rounded-full"
                style={{ width: `${sosProgress}%` }}
              />
            )}
            <span className="relative z-10">
              {sosHolding ? `Hold ${Math.ceil((3000 - (sosProgress / 100) * 3000) / 1000)}s...` : 'SOS \u2014 Hold 3 Seconds'}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
