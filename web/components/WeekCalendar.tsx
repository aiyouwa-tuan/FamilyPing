'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Checkin, Mood } from '@/lib/types'

interface WeekCalendarProps {
  userId: string
}

const moodColors: Record<Mood, string> = {
  great: 'bg-green-400',
  ok: 'bg-yellow-400',
  not_great: 'bg-red-400',
}

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function WeekCalendar({ userId }: WeekCalendarProps) {
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function fetchCheckins() {
      const now = new Date()
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 6)

      const { data } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: true })

      if (data) setCheckins(data)
    }
    fetchCheckins()
  }, [userId, supabase])

  // Build 7-day array
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - 6 + i)
    return d
  })

  function getCheckinForDay(date: Date): Checkin | undefined {
    return checkins.find((c) => {
      const cDate = new Date(c.created_at)
      return (
        cDate.getFullYear() === date.getFullYear() &&
        cDate.getMonth() === date.getMonth() &&
        cDate.getDate() === date.getDate()
      )
    })
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-3">This Week&apos;s Check-ins</h3>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const checkin = getCheckinForDay(day)
          const isToday = day.toDateString() === new Date().toDateString()
          return (
            <div key={day.toISOString()} className="flex flex-col items-center gap-1">
              <span className={`text-xs ${isToday ? 'font-bold text-[#FF6B35]' : 'text-gray-500'}`}>
                {dayLabels[day.getDay()]}
              </span>
              <span className={`text-xs ${isToday ? 'font-bold text-gray-900' : 'text-gray-400'}`}>
                {day.getDate()}
              </span>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  checkin
                    ? moodColors[checkin.mood as Mood]
                    : isToday
                    ? 'border-2 border-dashed border-[#FF6B35]'
                    : 'bg-gray-100'
                }`}
              >
                {checkin && (
                  <span className="text-white text-xs font-bold">
                    {checkin.mood === 'great' ? '\u2713' : checkin.mood === 'ok' ? '-' : '!'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
