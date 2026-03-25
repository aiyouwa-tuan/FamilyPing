'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { User, DailyMetric, Anomaly, WeeklySummary } from '@/lib/types'

export default function HealthDashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [todayMetric, setTodayMetric] = useState<DailyMetric | null>(null)
  const [yesterdaySteps, setYesterdaySteps] = useState<number | null>(null)
  const [metrics, setMetrics] = useState<DailyMetric[]>([])
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { router.push('/auth/login'); return }

    const { data: userData } = await supabase.from('users').select('*').eq('auth_id', authUser.id).limit(1).single()
    if (!userData) { setLoading(false); return }
    setCurrentUser(userData)

    // Get parent user for metrics
    const { data: parentData } = await supabase.from('users').select('id').eq('family_id', userData.family_id).eq('role', 'parent').limit(1).single()
    const targetUserId = parentData?.id || userData.id

    // Get daily metrics (last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { data: metricsData } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('user_id', targetUserId)
      .gte('date', weekAgo.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (metricsData) {
      setMetrics(metricsData)
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const todayM = metricsData.find(m => m.date === today)
      const yesterdayM = metricsData.find(m => m.date === yesterday)
      if (todayM) setTodayMetric(todayM)
      if (yesterdayM?.steps) setYesterdaySteps(yesterdayM.steps)
    }

    // Get anomalies
    const { data: anomalyData } = await supabase
      .from('anomalies')
      .select('*')
      .eq('family_id', userData.family_id)
      .eq('acknowledged', false)
      .order('created_at', { ascending: false })
      .limit(5)

    if (anomalyData) setAnomalies(anomalyData)

    // Get weekly summary
    const { data: summaryData } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('family_id', userData.family_id)
      .order('week_start', { ascending: false })
      .limit(1)
      .single()

    if (summaryData) setWeeklySummary(summaryData)

    setLoading(false)
  }, [supabase, router])

  useEffect(() => { fetchData() }, [fetchData])

  async function dismissAnomaly(id: string) {
    await supabase.from('anomalies').update({ acknowledged: true }).eq('id', id)
    setAnomalies(anomalies.filter(a => a.id !== id))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading health data...</div>
      </div>
    )
  }

  const maxSteps = Math.max(...metrics.map(m => m.steps || 0), 5000)

  // Trend arrow for steps
  const stepsTrend = todayMetric?.steps && yesterdaySteps
    ? todayMetric.steps > yesterdaySteps ? 'up' : todayMetric.steps < yesterdaySteps ? 'down' : 'flat'
    : null

  // Sleep data from latest metric
  const latestWithSleep = [...metrics].reverse().find(m => m.sleep_hours)

  return (
    <div className="min-h-screen bg-[#FFF8F0] py-8 pb-24">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">{'\u2190'}</Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Health</h1>
            <p className="text-sm text-gray-500">Daily metrics and patterns</p>
          </div>
        </div>

        {/* Steps Today */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Steps Today</h3>
            {stepsTrend && (
              <span className={`text-sm font-bold ${stepsTrend === 'up' ? 'text-green-500' : stepsTrend === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
                {stepsTrend === 'up' ? '\u2191' : stepsTrend === 'down' ? '\u2193' : '\u2192'}
                {stepsTrend === 'up' ? ' Up' : stepsTrend === 'down' ? ' Down' : ' Same'}
              </span>
            )}
          </div>
          <p className="text-4xl font-bold text-[#FF6B35]">
            {todayMetric?.steps?.toLocaleString() || '--'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {yesterdaySteps ? `Yesterday: ${yesterdaySteps.toLocaleString()}` : 'No comparison data'}
          </p>
        </div>

        {/* 7-Day Steps Bar Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Steps (Last 7 Days)</h3>
          {metrics.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No step data available yet.</p>
          ) : (
            <div className="flex items-end gap-2 h-40">
              {metrics.map((m) => {
                const height = ((m.steps || 0) / maxSteps) * 100
                const dayLabel = new Date(m.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })
                return (
                  <div key={m.id} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-500 font-medium">{((m.steps || 0) / 1000).toFixed(1)}k</span>
                    <div className="w-full relative rounded-t-lg overflow-hidden" style={{ height: `${Math.max(height, 4)}%` }}>
                      <div className="absolute inset-0 bg-[#4ECDC4] rounded-t-lg" />
                    </div>
                    <span className="text-[10px] text-gray-400">{dayLabel}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sleep Data */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Sleep</h3>
          {latestWithSleep ? (
            <div className="flex items-center gap-6">
              <div>
                <p className="text-3xl font-bold text-[#4ECDC4]">{latestWithSleep.sleep_hours?.toFixed(1)}</p>
                <p className="text-xs text-gray-400">hours</p>
              </div>
              <div className="flex-1">
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4ECDC4] rounded-full transition-all"
                    style={{ width: `${Math.min((latestWithSleep.sleep_hours || 0) / 10 * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-gray-400">0h</span>
                  <span className="text-[10px] text-gray-400">10h</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No sleep data available.</p>
          )}
          {latestWithSleep?.sleep_quality && (
            <p className="text-xs text-gray-500 mt-2">Quality: {latestWithSleep.sleep_quality}</p>
          )}
        </div>

        {/* Heart Rate */}
        {metrics.some(m => m.heart_rate_avg) && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Avg Heart Rate</h3>
            <p className="text-3xl font-bold text-[#FF6B35]">
              {Math.round(metrics.reduce((acc, m) => acc + (m.heart_rate_avg || 0), 0) / metrics.filter(m => m.heart_rate_avg).length)}
              <span className="text-sm font-normal text-gray-400 ml-1">bpm</span>
            </p>
          </div>
        )}

        {/* Anomaly Alerts */}
        {anomalies.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Alerts</h3>
            {anomalies.map((a) => (
              <div
                key={a.id}
                className={`rounded-2xl p-4 shadow-sm flex items-start justify-between gap-3 ${
                  a.severity === 'high'
                    ? 'bg-red-50 border border-red-200'
                    : a.severity === 'medium'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-blue-50 border border-blue-200'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${a.severity === 'high' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                    <p className="text-sm font-semibold text-gray-900">{a.type}</p>
                  </div>
                  <p className="text-sm text-gray-600">{a.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(a.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                </div>
                <button
                  onClick={() => dismissAnomaly(a.id)}
                  className="text-xs bg-white px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 shrink-0"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Weekly AI Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Weekly AI Summary</h3>
          {weeklySummary ? (
            <div>
              <p className="text-sm text-gray-600 mb-3">{weeklySummary.summary}</p>
              {weeklySummary.highlights && weeklySummary.highlights.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-green-600 mb-1">Highlights</p>
                  <ul className="space-y-1">
                    {weeklySummary.highlights.map((h, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">{'\u2713'}</span> {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {weeklySummary.concerns && weeklySummary.concerns.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-orange-600 mb-1">Concerns</p>
                  <ul className="space-y-1">
                    {weeklySummary.concerns.map((c, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-orange-500 mt-0.5">!</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">No weekly summary available yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
