'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Mood } from '@/lib/types'

interface MoodSelectorProps {
  userId: string
  familyId: string
  onCheckin?: () => void
}

const moods: { value: Mood; emoji: string; label: string; color: string }[] = [
  { value: 'great', emoji: '\u{1F60A}', label: 'Great', color: 'bg-green-100 border-green-300 hover:bg-green-200' },
  { value: 'ok', emoji: '\u{1F642}', label: 'OK', color: 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200' },
  { value: 'not_great', emoji: '\u{1F614}', label: 'Not Great', color: 'bg-red-100 border-red-300 hover:bg-red-200' },
]

export default function MoodSelector({ userId, familyId, onCheckin }: MoodSelectorProps) {
  const [selected, setSelected] = useState<Mood | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const supabase = createClient()

  async function handleSelect(mood: Mood) {
    setSelected(mood)
    setLoading(true)

    const { error } = await supabase.from('checkins').insert({
      user_id: userId,
      family_id: familyId,
      mood,
    })

    if (error) {
      console.error('Checkin error:', error)
    } else {
      setDone(true)
      onCheckin?.()
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <p className="text-lg font-medium text-gray-900">Thanks for checking in!</p>
        <p className="text-sm text-gray-500 mt-1">
          You selected: {moods.find((m) => m.value === selected)?.label}
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-3">How are you feeling today?</p>
      <div className="grid grid-cols-3 gap-3">
        {moods.map((mood) => (
          <button
            key={mood.value}
            onClick={() => handleSelect(mood.value)}
            disabled={loading}
            className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all disabled:opacity-50 ${mood.color}`}
          >
            <span className="text-3xl">{mood.emoji}</span>
            <span className="text-sm font-medium text-gray-700">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
