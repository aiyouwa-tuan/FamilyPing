'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { User, Checkin, Mood } from '@/lib/types'

interface ParentStatusCardProps {
  familyId: string
}

const moodLabels: Record<Mood, string> = {
  great: 'Feeling Great',
  ok: 'Doing OK',
  not_great: 'Not Great',
}

const moodEmojis: Record<Mood, string> = {
  great: '\u{1F60A}',
  ok: '\u{1F642}',
  not_great: '\u{1F614}',
}

export default function ParentStatusCard({ familyId }: ParentStatusCardProps) {
  const [parent, setParent] = useState<User | null>(null)
  const [lastCheckin, setLastCheckin] = useState<Checkin | null>(null)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchParentData() {
      // Get parent user
      const { data: parentData } = await supabase
        .from('users')
        .select('*')
        .eq('family_id', familyId)
        .eq('role', 'parent')
        .limit(1)
        .single()

      if (!parentData) {
        setLoading(false)
        return
      }

      setParent(parentData)

      // Get latest check-in
      const { data: checkinData } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', parentData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (checkinData) setLastCheckin(checkinData)

      // Calculate streak
      const { data: recentCheckins } = await supabase
        .from('checkins')
        .select('created_at')
        .eq('user_id', parentData.id)
        .order('created_at', { ascending: false })
        .limit(30)

      if (recentCheckins) {
        let currentStreak = 0
        const today = new Date()
        for (let i = 0; i < 30; i++) {
          const checkDate = new Date(today)
          checkDate.setDate(checkDate.getDate() - i)
          const hasCheckin = recentCheckins.some((c) => {
            const cDate = new Date(c.created_at)
            return (
              cDate.getFullYear() === checkDate.getFullYear() &&
              cDate.getMonth() === checkDate.getMonth() &&
              cDate.getDate() === checkDate.getDate()
            )
          })
          if (hasCheckin) {
            currentStreak++
          } else if (i > 0) {
            break
          }
        }
        setStreak(currentStreak)
      }

      setLoading(false)
    }
    fetchParentData()
  }, [familyId, supabase])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  if (!parent) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <p className="text-gray-500">No parent found in this family. Invite a parent to get started.</p>
      </div>
    )
  }

  const mood = lastCheckin?.mood as Mood | undefined
  const lastCheckinTime = lastCheckin
    ? new Date(lastCheckin.created_at).toLocaleString()
    : 'No check-ins yet'

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{parent.name}</h2>
          <p className="text-sm text-gray-500">Parent</p>
        </div>
        {mood && (
          <div className="text-center">
            <span className="text-4xl">{moodEmojis[mood]}</span>
            <p className="text-xs text-gray-500 mt-1">{moodLabels[mood]}</p>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#FFF8F0] rounded-lg p-3">
          <p className="text-xs text-gray-500">Last Check-in</p>
          <p className="text-sm font-medium text-gray-900">{lastCheckinTime}</p>
        </div>
        <div className="bg-[#FFF8F0] rounded-lg p-3">
          <p className="text-xs text-gray-500">Streak</p>
          <p className="text-sm font-medium text-[#FF6B35]">{streak} day{streak !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </div>
  )
}
