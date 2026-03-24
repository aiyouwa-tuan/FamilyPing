'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { User, DailyMetric, Anomaly, WeeklySummary } from '@/lib/types'

export default function HealthDashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [metrics, setMetrics] = useState<DailyMetric[]>([])
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null)
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

    // Get parent user for metrics
    const { data: parentData } = await supabase
      .from('users')
      .select('id')
      .eq('family_id', userData.family_id)
      .eq('role', 'parent')
      .limit(1)
      .single()

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

    if (metricsData) setMetrics(metricsData)

    // Get anomalies
    const { data: anomalyData } = await supabase
      .from('anomalies')
      .select('*')
      .eq('family_id', userData.family_id)
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

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function acknowledgeAnomaly(id: string) {
    await supabase.from('anomalies').update({ acknowledged: true }).eq('id', id)
    setAnomalies(anomalies.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  const maxSteps = Math.max(...metrics.map((m) => m.steps || 0), 10000)

  return (
    <div className="min-h-screen bg-[#FFF8F0] py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health Dashboard</h1>
          <p className="text-sm text-gray-500">Track daily health metrics and patterns</p>
        </div>

        {/* Steps Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Steps (Last 7 Days)</h3>
          {metrics.length === 0 ? (
            <p className="text-gray-400 text-sm">No step data available yet.</p>
          ) : (
            <div className="flex items-end gap-3 h-48">
              {metrics.map((m) => {
                const height = ((m.steps || 0) / maxSteps) * 100
                const dayLabel = new Date(m.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })
                return (
                  <div key={m.id} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">{(m.steps || 0).toLocaleString()}</span>
                    <div
                      className="w-full bg-[#4ECDC4] rounded-t-lg transition-all"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <span className="text-xs text-gray-400">{dayLabel}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Additional Metrics */}
        {metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Avg Heart Rate</p>
              <p className="text-2xl font-bold text-[#FF6B35]">
                {metrics.filter((m) => m.heart_rate_avg).length > 0
                  ? Math.round(
                      metrics.reduce((acc, m) => acc + (m.heart_rate_avg || 0), 0) /
                        metrics.filter((m) => m.heart_rate_avg).length
                    )
                  : '--'}
              </p>
              <p className="text-xs text-gray-400">bpm</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Avg Sleep</p>
              <p className="text-2xl font-bold text-[#4ECDC4]">
                {metrics.filter((m) => m.sleep_hours).length > 0
                  ? (
                      metrics.reduce((acc, m) => acc + (m.sleep_hours || 0), 0) /
                      metrics.filter((m) => m.sleep_hours).length
                    ).toFixed(1)
                  : '--'}
              </p>
              <p className="text-xs text-gray-400">hours</p>
            </div>
          </div>
        )}

        {/* Anomaly Alerts */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Anomaly Alerts</h3>
          {anomalies.length === 0 ? (
            <p className="text-gray-400 text-sm">No anomalies detected. Looking good!</p>
          ) : (
            <div className="space-y-3">
              {anomalies.map((a) => (
                <div
                  key={a.id}
                  className={`flex items-start justify-between gap-4 p-4 rounded-lg ${
                    a.severity === 'high'
                      ? 'bg-red-50 border border-red-200'
                      : a.severity === 'medium'
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.type}</p>
                    <p className="text-sm text-gray-600">{a.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!a.acknowledged && (
                    <button
                      onClick={() => acknowledgeAnomaly(a.id)}
                      className="text-xs bg-white px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 shrink-0"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Summary</h3>
          {weeklySummary ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">{weeklySummary.summary}</p>
              {weeklySummary.highlights && weeklySummary.highlights.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-green-600 mb-1">Highlights</p>
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
                  <p className="text-xs font-medium text-orange-600 mb-1">Concerns</p>
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
            <p className="text-gray-400 text-sm">No weekly summary available yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
