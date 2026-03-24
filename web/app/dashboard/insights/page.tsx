'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { User, DailyInsight } from '@/lib/types'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function InsightsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [todayInsight, setTodayInsight] = useState<DailyInsight | null>(null)
  const [pastInsights, setPastInsights] = useState<DailyInsight[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

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

    const today = new Date().toISOString().split('T')[0]

    // Get today's insight
    const { data: todayData } = await supabase
      .from('daily_insights')
      .select('*')
      .eq('family_id', userData.family_id)
      .eq('date', today)
      .limit(1)
      .single()

    if (todayData) setTodayInsight(todayData)

    // Get past insights
    const { data: pastData } = await supabase
      .from('daily_insights')
      .select('*')
      .eq('family_id', userData.family_id)
      .lt('date', today)
      .order('date', { ascending: false })
      .limit(7)

    if (pastData) setPastInsights(pastData)

    setLoading(false)
  }, [supabase, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleChat(e: React.FormEvent) {
    e.preventDefault()
    if (!chatInput.trim() || !currentUser) return

    const userMsg: ChatMessage = { role: 'user', content: chatInput.trim() }
    setChatMessages((prev) => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)

    try {
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('query-ai', {
        body: {
          message: userMsg.content,
          family_id: currentUser.family_id,
          user_id: currentUser.id,
        },
      })

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: error
          ? 'Sorry, I could not process your request right now. Please try again later.'
          : data?.response || 'No response received.',
      }
      setChatMessages((prev) => [...prev, assistantMsg])
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, the AI service is not available right now.' },
      ])
    }

    setChatLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
          <p className="text-sm text-gray-500">AI-powered analysis of your family&apos;s wellbeing</p>
        </div>

        {/* Today's Insight */}
        <div className="bg-gradient-to-r from-[#FF6B35] to-[#ff8a5c] rounded-2xl p-6 text-white shadow-lg">
          <p className="text-sm opacity-80 mb-2">Today&apos;s Insight</p>
          {todayInsight ? (
            <div>
              <p className="text-lg font-medium">{todayInsight.insight}</p>
              <span className="inline-block mt-3 px-3 py-1 bg-white/20 rounded-full text-xs">
                {todayInsight.category}
              </span>
            </div>
          ) : (
            <p className="text-lg opacity-80">No insight available for today yet. Check back later!</p>
          )}
        </div>

        {/* Past Insights */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Insights</h3>
          {pastInsights.length === 0 ? (
            <p className="text-gray-400 text-sm">No past insights available yet.</p>
          ) : (
            <div className="space-y-4">
              {pastInsights.map((insight) => (
                <div key={insight.id} className="border-l-4 border-[#4ECDC4] pl-4 py-2">
                  <p className="text-sm text-gray-900">{insight.insight}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400">{insight.date}</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
                      {insight.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Chat */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ask the AI</h3>
          <p className="text-sm text-gray-500 mb-4">
            Ask questions about patterns, health trends, or get suggestions for your family.
          </p>

          {/* Chat Messages */}
          <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-[#FF6B35] text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-900 rounded-bl-md'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md text-sm text-gray-400">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleChat} className="flex gap-3">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about health trends, patterns, or suggestions..."
              className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] text-gray-900"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#e55a2b] transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
