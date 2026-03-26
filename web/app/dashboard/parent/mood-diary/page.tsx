'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface DiaryEntry {
  date: string
  mood: string
  journal: string
  timestamp: number
}

const STORAGE_KEY = 'familyping_mood_diary'

const moodOptions = [
  { value: 'amazing', emoji: '\uD83E\uDD29', label: 'Amazing', bg: 'bg-purple-50', border: 'border-purple-300', activeBg: 'bg-purple-100', text: 'text-purple-700' },
  { value: 'happy', emoji: '\uD83D\uDE0A', label: 'Happy', bg: 'bg-green-50', border: 'border-green-300', activeBg: 'bg-green-100', text: 'text-green-700' },
  { value: 'okay', emoji: '\uD83D\uDE42', label: 'Okay', bg: 'bg-yellow-50', border: 'border-yellow-300', activeBg: 'bg-yellow-100', text: 'text-yellow-700' },
  { value: 'sad', emoji: '\uD83D\uDE14', label: 'Sad', bg: 'bg-blue-50', border: 'border-blue-300', activeBg: 'bg-blue-100', text: 'text-blue-700' },
  { value: 'terrible', emoji: '\uD83D\uDE2D', label: 'Terrible', bg: 'bg-red-50', border: 'border-red-300', activeBg: 'bg-red-100', text: 'text-red-700' },
]

export default function MoodDiaryPage() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [journal, setJournal] = useState('')
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const loadData = useCallback(async () => {
    // Check auth
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      router.push('/auth/login')
      return
    }

    // Load entries from localStorage
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed: DiaryEntry[] = JSON.parse(stored)
        // Only keep last 30 days
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
        const recent = parsed.filter((e) => e.timestamp > thirtyDaysAgo)
        setEntries(recent)

        // Check if already written today
        const today = new Date().toISOString().split('T')[0]
        const todayEntry = recent.find((e) => e.date === today)
        if (todayEntry) {
          setSelectedMood(todayEntry.mood)
          setJournal(todayEntry.journal)
          setSaved(true)
        }
      } catch {
        // ignore
      }
    }

    setLoading(false)
  }, [supabase, router])

  useEffect(() => {
    loadData()
  }, [loadData])

  function handleSave() {
    if (!selectedMood) return

    const today = new Date().toISOString().split('T')[0]
    const newEntry: DiaryEntry = {
      date: today,
      mood: selectedMood,
      journal: journal.trim(),
      timestamp: Date.now(),
    }

    // Replace today's entry or add new one
    const updatedEntries = entries.filter((e) => e.date !== today)
    updatedEntries.unshift(newEntry)

    // Keep only 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    const trimmed = updatedEntries.filter((e) => e.timestamp > thirtyDaysAgo)

    setEntries(trimmed)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function getMoodEmoji(mood: string): string {
    return moodOptions.find((m) => m.value === mood)?.emoji || '\uD83D\uDE42'
  }

  function getMoodLabel(mood: string): string {
    return moodOptions.find((m) => m.value === mood)?.label || mood
  }

  // Past 7 days entries
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recentEntries = entries.filter((e) => e.timestamp > sevenDaysAgo)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="animate-pulse text-[#FF6B35] text-[24px] font-bold">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-24">
      <div className="max-w-lg mx-auto px-5 pt-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/parent"
            className="w-[52px] h-[52px] bg-white rounded-2xl flex items-center justify-center shadow-sm border border-orange-100 text-[24px] active:scale-95"
          >
            {'\u2190'}
          </Link>
          <div>
            <h1 className="text-[32px] font-bold text-gray-900">Mood Diary</h1>
            <p className="text-[18px] text-gray-500">How are you feeling today?</p>
          </div>
        </div>

        {/* Today's Entry */}
        <div className="bg-white rounded-3xl p-7 shadow-sm border border-orange-100 space-y-6">
          <h2 className="text-[24px] font-bold text-gray-900">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h2>

          {/* 5 Mood Buttons */}
          <div>
            <p className="text-[20px] font-semibold text-gray-700 mb-4">Select your mood:</p>
            <div className="grid grid-cols-5 gap-3">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => { setSelectedMood(mood.value); setSaved(false) }}
                  className={`flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border-2 transition-all active:scale-95 min-h-[90px] ${
                    selectedMood === mood.value
                      ? `${mood.activeBg} ${mood.border} ring-2 ring-offset-1 ring-${mood.border.replace('border-', '')}`
                      : `${mood.bg} ${mood.border} hover:opacity-80`
                  }`}
                >
                  <span className="text-[36px] leading-none">{mood.emoji}</span>
                  <span className={`text-[14px] font-bold ${mood.text}`}>{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Journal Text Area */}
          <div>
            <p className="text-[20px] font-semibold text-gray-700 mb-3">Write about your day:</p>
            <textarea
              value={journal}
              onChange={(e) => { setJournal(e.target.value); setSaved(false) }}
              placeholder="What happened today? How do you feel? What are you thankful for?"
              rows={5}
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent text-[20px] text-gray-900 placeholder:text-gray-400 resize-none leading-relaxed"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!selectedMood}
            className={`w-full py-5 rounded-2xl font-bold text-[22px] min-h-[68px] transition-all active:scale-[0.98] ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-[#FF6B35] text-white hover:bg-[#e55a2b] disabled:opacity-40 disabled:hover:bg-[#FF6B35]'
            }`}
          >
            {saved ? 'Saved!' : 'Save Entry'}
          </button>
        </div>

        {/* Past 7 Days */}
        <div>
          <h2 className="text-[24px] font-bold text-gray-900 mb-4">Past 7 Days</h2>
          {recentEntries.length === 0 ? (
            <div className="bg-white rounded-3xl p-7 shadow-sm border border-orange-100 text-center">
              <p className="text-[20px] text-gray-400">No entries yet. Start writing today!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <div
                  key={entry.date}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-[36px]">{getMoodEmoji(entry.mood)}</span>
                    <div>
                      <p className="text-[20px] font-bold text-gray-900">
                        {new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-[18px] text-gray-500 capitalize">{getMoodLabel(entry.mood)}</p>
                    </div>
                  </div>
                  {entry.journal && (
                    <p className="text-[18px] text-gray-700 leading-relaxed border-t border-gray-100 pt-3 mt-1">
                      {entry.journal}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mood Streak */}
        {recentEntries.length >= 3 && (
          <div className="bg-gradient-to-br from-[#FF6B35] to-[#ff8c5c] rounded-3xl p-7 text-white text-center">
            <p className="text-[40px] mb-2">{'\uD83D\uDD25'}</p>
            <p className="text-[24px] font-bold">{recentEntries.length}-Day Streak!</p>
            <p className="text-[18px] opacity-90 mt-1">Keep writing to track your feelings.</p>
          </div>
        )}
      </div>
    </div>
  )
}
