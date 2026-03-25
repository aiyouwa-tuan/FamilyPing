'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { User, VoiceCall, ConversationMemory } from '@/lib/types'

export default function CallsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [latestCall, setLatestCall] = useState<VoiceCall | null>(null)
  const [pastCalls, setPastCalls] = useState<VoiceCall[]>([])
  const [moodTrend, setMoodTrend] = useState<{ date: string; score: number }[]>([])
  const [topics, setTopics] = useState<ConversationMemory[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { router.push('/auth/login'); return }

    const { data: userData } = await supabase.from('users').select('*').eq('auth_id', authUser.id).limit(1).single()
    if (!userData) { setLoading(false); return }
    setCurrentUser(userData)

    // Get voice calls
    const { data: callsData } = await supabase
      .from('voice_calls')
      .select('*')
      .eq('family_id', userData.family_id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (callsData && callsData.length > 0) {
      setLatestCall(callsData[0])
      setPastCalls(callsData.slice(1))

      // Build 30-day mood trend from calls with mood_score
      const withMood = callsData
        .filter((c: VoiceCall) => c.mood_score !== null && c.mood_score !== undefined)
        .map((c: VoiceCall) => ({
          date: new Date(c.created_at).toISOString().split('T')[0],
          score: c.mood_score!,
        }))
        .reverse()
      setMoodTrend(withMood)
    }

    // Get conversation memory / topics
    const { data: memoryData } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('family_id', userData.family_id)
      .order('last_mentioned', { ascending: false })
      .limit(10)

    if (memoryData) setTopics(memoryData)

    setLoading(false)
  }, [supabase, router])

  useEffect(() => { fetchData() }, [fetchData])

  function formatDuration(seconds?: number): string {
    if (!seconds) return '--'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading calls...</div>
      </div>
    )
  }

  const maxMood = Math.max(...moodTrend.map(m => m.score), 10)

  return (
    <div className="min-h-screen bg-[#FFF8F0] py-8 pb-24">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">{'\u2190'}</Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Voice Calls</h1>
            <p className="text-sm text-gray-500">AI-powered call summaries</p>
          </div>
        </div>

        {/* Latest Call Summary */}
        {latestCall ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Latest Call</h3>
              <span className="text-xs text-gray-400">
                {new Date(latestCall.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#FFF8F0] rounded-xl p-3">
                <p className="text-xs text-gray-500">Duration</p>
                <p className="text-lg font-bold text-gray-900">{formatDuration(latestCall.duration_seconds)}</p>
              </div>
              <div className="bg-[#FFF8F0] rounded-xl p-3">
                <p className="text-xs text-gray-500">Mood Score</p>
                <p className="text-lg font-bold text-[#FF6B35]">{latestCall.mood_score ?? '--'}<span className="text-xs font-normal text-gray-400">/10</span></p>
              </div>
            </div>
            {latestCall.summary && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Summary</p>
                <p className="text-sm text-gray-700 leading-relaxed">{latestCall.summary}</p>
              </div>
            )}
            {latestCall.topics && latestCall.topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {latestCall.topics.map((t, i) => (
                  <span key={i} className="text-xs bg-[#4ECDC4]/10 text-[#4ECDC4] px-2 py-1 rounded-full">{t}</span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="text-4xl mb-3">{'\u{1F399}'}</div>
            <p className="text-gray-500 text-sm">No voice calls recorded yet.</p>
          </div>
        )}

        {/* 30-Day Mood Trend */}
        {moodTrend.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Mood Trend</h3>
            <div className="flex items-end gap-1 h-24">
              {moodTrend.map((m, i) => {
                const height = (m.score / maxMood) * 100
                const color = m.score >= 7 ? 'bg-green-400' : m.score >= 4 ? 'bg-yellow-400' : 'bg-red-400'
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${m.date}: ${m.score}/10`}>
                    <div className={`w-full ${color} rounded-t`} style={{ height: `${Math.max(height, 4)}%` }} />
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">{moodTrend[0]?.date}</span>
              <span className="text-[10px] text-gray-400">{moodTrend[moodTrend.length - 1]?.date}</span>
            </div>
          </div>
        )}

        {/* Topic Tracker */}
        {topics.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Topics Discussed</h3>
            <div className="space-y-2">
              {topics.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{t.topic}</p>
                    {t.detail && <p className="text-xs text-gray-400 truncate">{t.detail}</p>}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    {t.mention_count && <span className="text-xs text-[#FF6B35] font-medium">{t.mention_count}x</span>}
                    {t.last_mentioned && (
                      <p className="text-[10px] text-gray-400">
                        {new Date(t.last_mentioned).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Calls */}
        {pastCalls.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Past Calls</h3>
            <div className="space-y-3">
              {pastCalls.map((call) => (
                <div key={call.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(call.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-400">{formatDuration(call.duration_seconds)}</p>
                  </div>
                  <div className="text-right">
                    {call.mood_score !== null && call.mood_score !== undefined && (
                      <p className={`text-sm font-bold ${call.mood_score >= 7 ? 'text-green-500' : call.mood_score >= 4 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {call.mood_score}/10
                      </p>
                    )}
                    <p className="text-xs text-gray-400 capitalize">{call.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule Call Button */}
        <button
          onClick={() => alert('Call scheduling coming soon! This feature will be available in a future update.')}
          className="w-full bg-[#FF6B35] text-white py-4 rounded-2xl font-semibold hover:bg-[#e55a2b] transition-colors shadow-sm"
        >
          Schedule a Call
        </button>
      </div>
    </div>
  )
}
