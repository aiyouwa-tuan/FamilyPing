'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { User, DailyInsight } from '@/lib/types'

export default function InsightsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [todayInsight, setTodayInsight] = useState<DailyInsight | null>(null)
  const [pastInsights, setPastInsights] = useState<DailyInsight[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { router.push('/auth/login'); return }

    const { data: userData } = await supabase.from('users').select('*').eq('auth_id', authUser.id).limit(1).single()
    if (!userData) { setLoading(false); return }
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

    // Get past insights (7 days)
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

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading insights...</div>
      </div>
    )
  }

  const statusColor = todayInsight?.status === 'good' ? 'bg-green-400' : todayInsight?.status === 'watch' ? 'bg-yellow-400' : 'bg-gray-300'

  return (
    <div className="min-h-screen bg-[#FFF8F0] py-8 pb-24">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">{'\u2190'}</Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
            <p className="text-sm text-gray-500">AI-powered wellbeing analysis</p>
          </div>
        </div>

        {/* Today's Insight Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
            <h3 className="text-sm font-semibold text-gray-700">Today&apos;s Insight</h3>
          </div>
          {todayInsight ? (
            <div>
              {todayInsight.summary && (
                <p className="text-base font-medium text-gray-900 mb-3">{todayInsight.summary}</p>
              )}
              <p className="text-sm text-gray-600 mb-3">{todayInsight.insight}</p>
              {todayInsight.insights && todayInsight.insights.length > 0 && (
                <ul className="space-y-2 mb-3">
                  {todayInsight.insights.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-[#4ECDC4] mt-0.5">{'\u2022'}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {todayInsight.suggestion && (
                <div className="bg-[#FFF8F0] rounded-xl p-4 mt-3">
                  <p className="text-xs font-semibold text-[#FF6B35] mb-1">Suggestion</p>
                  <p className="text-sm text-gray-700">{todayInsight.suggestion}</p>
                </div>
              )}
              <span className="inline-block mt-3 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">{todayInsight.category}</span>
            </div>
          ) : (
            <p className="text-gray-400 text-sm py-4 text-center">No insight available for today yet. Check back later!</p>
          )}
        </div>

        {/* Weather Alert */}
        {todayInsight?.weather_alert && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-xl">{'\u{26C5}'}</span>
            <div>
              <p className="text-sm font-semibold text-blue-800">Weather Alert</p>
              <p className="text-sm text-blue-700">{todayInsight.weather_alert}</p>
            </div>
          </div>
        )}

        {/* Action Suggestion */}
        {currentUser && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
            <div className="flex gap-3">
              <Link href="/dashboard/messages" className="flex-1 bg-[#FF6B35] text-white py-3 rounded-xl text-center text-sm font-medium hover:bg-[#e55a2b] transition-colors">
                Send Message
              </Link>
              <Link href="/dashboard/calls" className="flex-1 bg-[#4ECDC4] text-white py-3 rounded-xl text-center text-sm font-medium hover:bg-[#3dbdb5] transition-colors">
                View Calls
              </Link>
            </div>
          </div>
        )}

        {/* Past Insights */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Past 7 Days</h3>
          {pastInsights.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No past insights available yet.</p>
          ) : (
            <div className="space-y-4">
              {pastInsights.map((insight) => (
                <div key={insight.id} className="border-l-4 border-[#4ECDC4] pl-4 py-2">
                  <p className="text-sm text-gray-900">{insight.insight}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400">
                      {new Date(insight.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">{insight.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ask AI Floating Button */}
        <Link
          href="/dashboard/chat-ai"
          className="fixed bottom-6 right-6 bg-[#FF6B35] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-[#e55a2b] transition-colors z-50"
        >
          <span className="text-xl">{'\u{1F4AC}'}</span>
        </Link>
      </div>
    </div>
  )
}
