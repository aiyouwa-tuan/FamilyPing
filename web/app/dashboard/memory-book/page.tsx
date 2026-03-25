'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { User, Checkin, Mood } from '@/lib/types'

const moodEmojis: Record<Mood, string> = {
  great: '\u{1F60A}',
  ok: '\u{1F642}',
  not_great: '\u{1F614}',
}

interface GroupedEntries {
  month: string
  entries: Checkin[]
}

export default function MemoryBookPage() {
  const [grouped, setGrouped] = useState<GroupedEntries[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { router.push('/auth/login'); return }

    const { data: userData } = await supabase.from('users').select('*').eq('auth_id', authUser.id).limit(1).single()
    if (!userData) { setLoading(false); return }

    // Get parent
    const { data: parentData } = await supabase.from('users').select('id').eq('family_id', userData.family_id).eq('role', 'parent').limit(1).single()
    const targetUserId = parentData?.id || userData.id

    // Get checkins with question answers
    const { data: checkins } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', targetUserId)
      .not('question_answer', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100)

    if (checkins && checkins.length > 0) {
      // Group by month
      const groups: Record<string, Checkin[]> = {}
      checkins.forEach((c: Checkin) => {
        const d = new Date(c.created_at)
        const key = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        if (!groups[key]) groups[key] = []
        groups[key].push(c)
      })
      setGrouped(Object.entries(groups).map(([month, entries]) => ({ month, entries })))
    }

    setLoading(false)
  }, [supabase, router])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading memories...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] py-8 pb-24">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">{'\u2190'}</Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Memory Book</h1>
            <p className="text-sm text-gray-500">Daily stories and reflections</p>
          </div>
        </div>

        {grouped.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="text-4xl mb-3">{'\u{1F4D6}'}</div>
            <p className="text-gray-500 text-sm">No memories yet. When your parent answers daily questions, their stories will appear here.</p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.month}>
              <h2 className="text-lg font-bold text-gray-900 mb-3">{group.month}</h2>
              <div className="space-y-3">
                {group.entries.map((entry) => {
                  const mood = entry.mood as Mood
                  return (
                    <div key={entry.id} className="bg-white rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-gray-400">
                          {new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                        <span className="text-lg">{moodEmojis[mood] || '\u{1F642}'}</span>
                      </div>
                      {entry.question && (
                        <p className="text-sm font-medium text-[#FF6B35] mb-2">&ldquo;{entry.question}&rdquo;</p>
                      )}
                      <p className="text-sm text-gray-700 leading-relaxed">{entry.question_answer}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
