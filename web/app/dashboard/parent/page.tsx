'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { User, Message } from '@/lib/types'
import MoodSelector from '@/components/MoodSelector'

const dailyQuestions = [
  'What was the best part of your day so far?',
  'Did you go for a walk today?',
  'What did you have for lunch?',
  'Who did you talk to today?',
  'Is there anything you need help with?',
  'What are you looking forward to this week?',
  'How did you sleep last night?',
]

export default function ParentDashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [latestMessage, setLatestMessage] = useState<Message | null>(null)
  const [answer, setAnswer] = useState('')
  const [submittingAnswer, setSubmittingAnswer] = useState(false)
  const [answerSent, setAnswerSent] = useState(false)
  const [sosActive, setSosActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const todayQuestion = dailyQuestions[new Date().getDay()]

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

    setLoading(false)
  }, [supabase, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleSubmitAnswer(e: React.FormEvent) {
    e.preventDefault()
    if (!answer.trim() || !currentUser) return
    setSubmittingAnswer(true)

    // Insert as a checkin with question/answer
    await supabase.from('checkins').insert({
      user_id: currentUser.id,
      family_id: currentUser.family_id,
      mood: 'ok',
      question: todayQuestion,
      answer: answer.trim(),
    })

    setAnswerSent(true)
    setSubmittingAnswer(false)
  }

  async function handleSOS() {
    if (!currentUser) return
    setSosActive(true)

    await supabase.from('sos_events').insert({
      user_id: currentUser.id,
      family_id: currentUser.family_id,
      status: 'active',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="text-gray-500">User not found. Please sign up first.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] py-8">
      <div className="max-w-lg mx-auto px-4 space-y-6">
        {/* Greeting */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Good {getTimeOfDay()}, {currentUser.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Weather Widget (simplified) */}
        <div className="bg-gradient-to-r from-[#4ECDC4] to-[#44b3ab] rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Today&apos;s Weather</p>
              <p className="text-3xl font-bold mt-1">72&deg;F</p>
              <p className="text-sm opacity-80 mt-1">Partly Cloudy</p>
            </div>
            <div className="text-5xl">{'\u26C5'}</div>
          </div>
        </div>

        {/* Latest Message from Family */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Message from Family</h3>
          {latestMessage ? (
            <div>
              <p className="text-gray-900">{latestMessage.content}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(latestMessage.created_at).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-gray-400">No messages yet</p>
          )}
        </div>

        {/* Mood Check-in */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <MoodSelector userId={currentUser.id} familyId={currentUser.family_id} />
        </div>

        {/* Daily Question */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Today&apos;s Question</h3>
          <p className="text-gray-900 font-medium mb-4">{todayQuestion}</p>
          {answerSent ? (
            <p className="text-sm text-green-600 font-medium">Thanks for sharing!</p>
          ) : (
            <form onSubmit={handleSubmitAnswer} className="flex gap-3">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer..."
                className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4ECDC4] text-gray-900"
              />
              <button
                type="submit"
                disabled={submittingAnswer || !answer.trim()}
                className="bg-[#4ECDC4] text-white px-5 py-3 rounded-lg font-medium hover:bg-[#44b3ab] transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </form>
          )}
        </div>

        {/* SOS Button */}
        <div className="text-center pt-4">
          {sosActive ? (
            <div className="bg-red-50 rounded-2xl p-6">
              <p className="text-red-600 font-bold text-lg">SOS Alert Sent!</p>
              <p className="text-red-500 text-sm mt-1">Your family has been notified.</p>
            </div>
          ) : (
            <button
              onClick={handleSOS}
              className="bg-red-500 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
            >
              SOS - I Need Help
            </button>
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
