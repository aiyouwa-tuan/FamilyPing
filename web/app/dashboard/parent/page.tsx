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
      // Try to get user location
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
      // Check for pre-generated morning greeting
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

    // Update the most recent checkin with the answer
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
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="animate-pulse text-[#FF6B35] text-[24px] font-bold">Loading...</div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-[22px] text-gray-600">User not found.</p>
          <p className="text-[20px] text-gray-500 mt-2">Please sign up first.</p>
        </div>
      </div>
    )
  }

  const weatherEmoji = weather ? (WEATHER_ICONS[weather.icon] || '\u2600\uFE0F') : '\u2600\uFE0F'

  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-32">
      <div className="max-w-lg mx-auto px-5 pt-8 space-y-6">

        {/* Greeting + Date */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-[32px] font-bold text-gray-900 leading-tight">
              Good {getTimeOfDay()}, {currentUser.name}
            </h1>
            {greetingAudioUrl && (
              <button
                onClick={handlePlayGreeting}
                className={`text-[28px] p-2 rounded-full transition-all ${
                  playingGreeting
                    ? 'bg-[#FF6B35] text-white animate-pulse'
                    : 'bg-orange-100 text-[#FF6B35] hover:bg-orange-200'
                }`}
                aria-label={playingGreeting ? 'Stop greeting' : 'Play greeting'}
              >
                {playingGreeting ? '\uD83D\uDD0A' : '\uD83D\uDD0A'}
              </button>
            )}
          </div>
          <p className="text-[22px] text-gray-500 mt-2">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Weather Card */}
        <div className="bg-gradient-to-br from-[#4ECDC4] to-[#38b2ac] rounded-3xl p-7 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[20px] opacity-90 font-medium">Today&apos;s Weather</p>
              <p className="text-[48px] font-bold mt-1 leading-none">
                {weather ? `${weather.temp}\u00B0F` : '--'}
              </p>
              <p className="text-[20px] opacity-90 mt-2 capitalize">
                {weather?.description || 'Loading...'}
              </p>
            </div>
            <div className="text-[72px] leading-none">{weatherEmoji}</div>
          </div>
        </div>

        {/* Listen Section */}
        <div className="bg-white rounded-3xl p-7 shadow-sm border border-orange-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[24px]">{'\uD83C\uDFA7'}</span>
            <h3 className="text-[22px] font-semibold text-gray-900">Listen</h3>
          </div>
          <p className="text-[20px] text-gray-600 mb-5 leading-relaxed">
            {voiceProfile
              ? `Hear stories in ${voiceProfile.voice_name}'s voice`
              : 'Ask your family to set up a voice for you'}
          </p>
          <Link
            href="/dashboard/parent/listen"
            className="block w-full bg-[#FF6B35] text-white py-4 rounded-2xl font-bold text-[22px] text-center hover:bg-[#e55a2b] transition-colors min-h-[64px] active:scale-[0.98]"
          >
            {'\u25B6'} Play Something
          </Link>
          <Link
            href="/dashboard/parent/read-aloud"
            className="block text-center mt-4 text-[18px] text-[#FF6B35] font-medium hover:underline"
          >
            {'\uD83D\uDCD6'} Read Aloud
          </Link>
        </div>

        {/* Latest Message from Family */}
        <div className="bg-white rounded-3xl p-7 shadow-sm border border-orange-100">
          <h3 className="text-[20px] font-semibold text-[#FF6B35] mb-3">
            Message from Family
          </h3>
          {latestMessage ? (
            <div>
              <p className="text-[22px] text-gray-900 leading-relaxed">{latestMessage.content}</p>
              <p className="text-[16px] text-gray-400 mt-3">
                {new Date(latestMessage.created_at).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-[20px] text-gray-400">No messages yet</p>
          )}
        </div>

        {/* Mood Check-in */}
        <div className="bg-white rounded-3xl p-7 shadow-sm border border-orange-100">
          <h3 className="text-[22px] font-semibold text-gray-900 mb-4">
            How are you feeling today?
          </h3>
          {checkinDone ? (
            <div className="text-center py-3">
              <p className="text-[24px] font-medium text-green-600">
                Thanks for checking in!
              </p>
              <p className="text-[20px] text-gray-500 mt-2">
                You selected: {moodSelected === 'great' ? 'Great' : moodSelected === 'ok' ? 'OK' : 'Not great'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleMoodSelect('great')}
                className="flex flex-col items-center gap-3 py-5 px-4 rounded-2xl border-3 border-green-300 bg-green-50 hover:bg-green-100 active:scale-95 transition-all min-h-[100px]"
              >
                <span className="text-[48px] leading-none">{'\uD83D\uDE0A'}</span>
                <span className="text-[20px] font-bold text-green-700">Great</span>
              </button>
              <button
                onClick={() => handleMoodSelect('ok')}
                className="flex flex-col items-center gap-3 py-5 px-4 rounded-2xl border-3 border-yellow-300 bg-yellow-50 hover:bg-yellow-100 active:scale-95 transition-all min-h-[100px]"
              >
                <span className="text-[48px] leading-none">{'\uD83D\uDE10'}</span>
                <span className="text-[20px] font-bold text-yellow-700">OK</span>
              </button>
              <button
                onClick={() => handleMoodSelect('not_great')}
                className="flex flex-col items-center gap-3 py-5 px-4 rounded-2xl border-3 border-red-300 bg-red-50 hover:bg-red-100 active:scale-95 transition-all min-h-[100px]"
              >
                <span className="text-[48px] leading-none">{'\uD83D\uDE14'}</span>
                <span className="text-[20px] font-bold text-red-700">Not great</span>
              </button>
            </div>
          )}
        </div>

        {/* Daily Question (shows after check-in) */}
        {checkinDone && (
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-orange-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[24px]">{'\uD83D\uDCAC'}</span>
              <h3 className="text-[20px] font-semibold text-[#FF6B35]">
                Today&apos;s Question
              </h3>
            </div>
            <p className="text-[22px] text-gray-900 font-medium mb-5 leading-relaxed">
              {todayQuestion.text}
            </p>
            {answerSent ? (
              <p className="text-[20px] text-green-600 font-medium">
                Thanks for sharing! Your family will love reading this.
              </p>
            ) : (
              <form onSubmit={handleSubmitAnswer} className="space-y-4">
                <textarea
                  value={questionAnswer}
                  onChange={(e) => setQuestionAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={3}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent text-[20px] text-gray-900 placeholder:text-gray-400 resize-none"
                />
                <button
                  type="submit"
                  disabled={submittingAnswer || !questionAnswer.trim()}
                  className="w-full bg-[#4ECDC4] text-white py-4 rounded-2xl font-bold text-[22px] hover:bg-[#38b2ac] transition-colors disabled:opacity-50 min-h-[64px] active:scale-[0.98]"
                >
                  {submittingAnswer ? 'Sending...' : 'Send Answer'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Quick Navigation */}
        <div className="grid grid-cols-3 gap-4">
          <Link
            href="/dashboard/parent/phonebook"
            className="bg-white rounded-3xl p-5 shadow-sm border border-orange-100 hover:shadow-md transition-shadow text-center min-h-[100px] flex flex-col items-center justify-center active:scale-95"
          >
            <div className="text-[40px] mb-2">{'\uD83D\uDCDE'}</div>
            <p className="text-[18px] font-bold text-gray-900">Phonebook</p>
          </Link>
          <Link
            href="/dashboard/parent/medical-card"
            className="bg-white rounded-3xl p-5 shadow-sm border border-orange-100 hover:shadow-md transition-shadow text-center min-h-[100px] flex flex-col items-center justify-center active:scale-95"
          >
            <div className="text-[40px] mb-2">{'\uD83C\uDFE5'}</div>
            <p className="text-[18px] font-bold text-gray-900">Medical</p>
          </Link>
          <Link
            href="/dashboard/parent/mood-diary"
            className="bg-white rounded-3xl p-5 shadow-sm border border-orange-100 hover:shadow-md transition-shadow text-center min-h-[100px] flex flex-col items-center justify-center active:scale-95"
          >
            <div className="text-[40px] mb-2">{'\uD83D\uDCD6'}</div>
            <p className="text-[18px] font-bold text-gray-900">Diary</p>
          </Link>
        </div>
      </div>

      {/* Fixed SOS Button */}
      <div className="fixed bottom-6 left-0 right-0 px-5 z-50">
        <div className="max-w-lg mx-auto">
          {sosActive ? (
            <div className="bg-red-50 border-2 border-red-300 rounded-3xl p-6 text-center shadow-lg">
              <p className="text-[28px] font-bold text-red-600">SOS Alert Sent!</p>
              <p className="text-[20px] text-red-500 mt-2">
                Your family has been notified.
              </p>
            </div>
          ) : (
            <div className="relative">
              <button
                onMouseDown={handleSOSStart}
                onMouseUp={handleSOSEnd}
                onMouseLeave={handleSOSEnd}
                onTouchStart={handleSOSStart}
                onTouchEnd={handleSOSEnd}
                onTouchCancel={handleSOSEnd}
                className="w-full bg-red-500 text-white py-5 rounded-3xl font-bold text-[24px] shadow-lg shadow-red-500/40 active:bg-red-600 transition-colors min-h-[72px] relative overflow-hidden select-none"
              >
                {/* Progress overlay */}
                {sosHolding && (
                  <div
                    className="absolute inset-0 bg-red-700 transition-none"
                    style={{ width: `${sosProgress}%` }}
                  />
                )}
                <span className="relative z-10">
                  {sosHolding ? `Hold ${Math.ceil((3000 - (sosProgress / 100) * 3000) / 1000)}s...` : 'SOS \u2014 Hold 3 Seconds'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Morning'
  if (hour < 17) return 'Afternoon'
  return 'Evening'
}
