'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { User, Message, Checkin, Mood } from '@/lib/types'

const moodEmojis: Record<Mood, string> = {
  great: '\u{1F60A}',
  ok: '\u{1F642}',
  not_great: '\u{1F614}',
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [parentUser, setParentUser] = useState<User | null>(null)
  const [lastCheckin, setLastCheckin] = useState<Checkin | null>(null)
  const [streak, setStreak] = useState(0)
  const [weekCheckins, setWeekCheckins] = useState<Checkin[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [moodDist, setMoodDist] = useState<Record<Mood, number>>({ great: 0, ok: 0, not_great: 0 })
  const [avgCheckinTime, setAvgCheckinTime] = useState<string | null>(null)
  const [monthTotal, setMonthTotal] = useState(0)
  const [todayAnswer, setTodayAnswer] = useState<{ question: string; answer: string } | null>(null)
  const [voiceProfiles, setVoiceProfiles] = useState<{ id: string; voice_name: string; status: string }[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState('')
  const [joiningFamily, setJoiningFamily] = useState(false)
  const [creatingFamily, setCreatingFamily] = useState(false)
  const [familyName, setFamilyName] = useState('')
  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState<'family' | 'parent'>('family')
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

    // Get parent user
    const { data: parentData } = await supabase
      .from('users')
      .select('*')
      .eq('family_id', userData.family_id)
      .eq('role', 'parent')
      .limit(1)
      .single()

    if (parentData) {
      setParentUser(parentData)

      // Get latest check-in
      const { data: lastC } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', parentData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (lastC) setLastCheckin(lastC)

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
          const hasCheckin = recentCheckins.some((c: { created_at: string }) => {
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

      // Week checkins for calendar
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 6)
      const { data: weekData } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', parentData.id)
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: true })

      if (weekData) setWeekCheckins(weekData)

      // Today's question answer
      const today = new Date().toISOString().split('T')[0]
      const { data: todayCheckin } = await supabase
        .from('checkins')
        .select('question, question_answer')
        .eq('user_id', parentData.id)
        .gte('created_at', today + 'T00:00:00')
        .lte('created_at', today + 'T23:59:59')
        .not('question_answer', 'is', null)
        .limit(1)
        .single()

      if (todayCheckin?.question && todayCheckin?.question_answer) {
        setTodayAnswer({ question: todayCheckin.question, answer: todayCheckin.question_answer })
      }
    }

    // Mood distribution & stats (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { data: checkinData } = await supabase
      .from('checkins')
      .select('mood, created_at')
      .eq('family_id', userData.family_id)
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (checkinData) {
      const dist: Record<Mood, number> = { great: 0, ok: 0, not_great: 0 }
      let totalMinutes = 0
      let count = 0
      checkinData.forEach((c: { mood: string; created_at: string }) => {
        if (c.mood in dist) dist[c.mood as Mood]++
        const d = new Date(c.created_at)
        totalMinutes += d.getHours() * 60 + d.getMinutes()
        count++
      })
      setMoodDist(dist)
      setMonthTotal(count)
      if (count > 0) {
        const avgMin = Math.round(totalMinutes / count)
        const h = Math.floor(avgMin / 60)
        const m = avgMin % 60
        const period = h >= 12 ? 'PM' : 'AM'
        const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h
        setAvgCheckinTime(`${hour12}:${m.toString().padStart(2, '0')} ${period}`)
      }
    }

    // Messages
    const { data: msgData } = await supabase
      .from('messages')
      .select('*')
      .eq('family_id', userData.family_id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (msgData) setMessages(msgData)

    // Get voice profiles for this family
    const { data: vpData } = await supabase
      .from('voice_profiles')
      .select('id, voice_name, status')
      .eq('family_id', userData.family_id)
      .order('created_at', { ascending: false })

    if (vpData) setVoiceProfiles(vpData)

    setLoading(false)
  }, [supabase, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !currentUser) return
    setSendingMsg(true)
    const { error } = await supabase.from('messages').insert({
      family_id: currentUser.family_id,
      sender_id: currentUser.id,
      sender_name: currentUser.name,
      content: newMessage.trim(),
      message_type: 'text',
    })
    if (!error) {
      setNewMessage('')
      fetchData()
    }
    setSendingMsg(false)
  }

  async function handleCreateFamily(e: React.FormEvent) {
    e.preventDefault()
    if (!familyName.trim() || !userName.trim()) return
    setCreatingFamily(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      const { data: family, error: famErr } = await supabase
        .from('families')
        .insert({ name: familyName.trim(), invite_code: code, plan: 'free' })
        .select()
        .single()
      if (famErr || !family) { alert('Failed to create family: ' + (famErr?.message || 'unknown')); setCreatingFamily(false); return }
      const { error: userErr } = await supabase
        .from('users')
        .insert({
          family_id: family.id,
          auth_id: authUser.id,
          role: userRole === 'parent' ? 'parent' : 'family',
          name: userName.trim(),
          email: authUser.email || '',
          phone: authUser.phone || '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          checkin_time: userRole === 'parent' ? '09:00' : null,
        })
      if (userErr) { alert('Failed to create user: ' + userErr.message); setCreatingFamily(false); return }
      fetchData()
    } catch {
      alert('Error creating family')
    }
    setCreatingFamily(false)
  }

  async function handleJoinFamily(e: React.FormEvent) {
    e.preventDefault()
    if (!joinCode.trim()) return
    setJoiningFamily(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return
    const { data: family } = await supabase
      .from('families')
      .select('*')
      .eq('invite_code', joinCode.trim().toUpperCase())
      .limit(1)
      .single()
    if (family) {
      await supabase.from('users').insert({
        auth_id: authUser.id,
        family_id: family.id,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        role: 'family',
        email: authUser.email || '',
      })
      fetchData()
    } else {
      alert('Invalid invite code')
    }
    setJoiningFamily(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading your dashboard...</div>
      </div>
    )
  }

  // No family yet - show join/create flow
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] py-12">
        <div className="max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Welcome to FamilyPing</h1>
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create a New Family</h2>
            <form onSubmit={handleCreateFamily} className="space-y-3">
              <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Your name" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] text-gray-900" />
              <input type="text" value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="Family name (e.g. Robinson Family)" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] text-gray-900" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setUserRole('family')} className={`flex-1 py-2 rounded-lg font-semibold border-2 transition-colors ${userRole === 'family' ? 'border-[#FF6B35] bg-[#FFF0E8] text-[#FF6B35]' : 'border-gray-200 text-gray-500'}`}>Family Member</button>
                <button type="button" onClick={() => setUserRole('parent')} className={`flex-1 py-2 rounded-lg font-semibold border-2 transition-colors ${userRole === 'parent' ? 'border-[#4ECDC4] bg-[#E8FAF8] text-[#4ECDC4]' : 'border-gray-200 text-gray-500'}`}>Parent</button>
              </div>
              <button type="submit" disabled={creatingFamily} className="w-full bg-[#FF6B35] text-white py-3 rounded-lg font-semibold hover:bg-[#e55a2b] transition-colors disabled:opacity-50">{creatingFamily ? 'Creating...' : 'Create Family'}</button>
            </form>
          </div>
          <div className="text-center text-gray-400 text-sm mb-4">-- or --</div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Join an Existing Family</h2>
            <form onSubmit={handleJoinFamily} className="space-y-4">
              <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Enter invite code (e.g. ABC123)" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] text-gray-900 uppercase" />
              <button type="submit" disabled={joiningFamily} className="w-full bg-[#4ECDC4] text-white py-3 rounded-lg font-semibold hover:bg-[#3dbdb5] transition-colors disabled:opacity-50">{joiningFamily ? 'Joining...' : 'Join Family'}</button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // If parent role, redirect to parent view
  if (currentUser.role === 'parent') {
    router.push('/dashboard/parent')
    return null
  }

  const totalMoods = moodDist.great + moodDist.ok + moodDist.not_great
  const mood = lastCheckin?.mood as Mood | undefined

  // Build 7-day calendar
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - 6 + i)
    return d
  })

  function getCheckinForDay(date: Date): Checkin | undefined {
    return weekCheckins.find((c) => {
      const cDate = new Date(c.created_at)
      return cDate.getFullYear() === date.getFullYear() && cDate.getMonth() === date.getMonth() && cDate.getDate() === date.getDate()
    })
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="min-h-screen bg-[#FFF8F0] py-8 pb-24">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back, {currentUser.name}</p>
        </div>

        {/* Parent Status Card */}
        {parentUser ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{parentUser.name}</h2>
                <p className="text-sm text-gray-500">Parent</p>
              </div>
              {mood && <span className="text-4xl">{moodEmojis[mood]}</span>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#FFF8F0] rounded-xl p-3">
                <p className="text-xs text-gray-500">Last Check-in</p>
                <p className="text-sm font-semibold text-gray-900">
                  {lastCheckin ? new Date(lastCheckin.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'No check-ins yet'}
                </p>
              </div>
              <div className="bg-[#FFF8F0] rounded-xl p-3">
                <p className="text-xs text-gray-500">Streak</p>
                <p className="text-sm font-semibold text-[#FF6B35]">{streak} day{streak !== 1 ? 's' : ''} {streak >= 7 ? '\u{1F525}' : ''}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <p className="text-gray-500 text-sm">No parent in this family yet. Invite a parent to get started.</p>
          </div>
        )}

        {/* 7-Day Calendar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">This Week</h3>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => {
              const checkin = getCheckinForDay(day)
              const isToday = day.toDateString() === new Date().toDateString()
              const isPast = day < new Date() && !isToday
              let dotColor = 'bg-gray-100' // missed/future
              if (checkin) {
                dotColor = checkin.mood === 'great' ? 'bg-green-400' : checkin.mood === 'ok' ? 'bg-yellow-400' : 'bg-red-400'
              } else if (isPast) {
                dotColor = 'bg-gray-200'
              }
              return (
                <div key={day.toISOString()} className="flex flex-col items-center gap-1">
                  <span className={`text-xs ${isToday ? 'font-bold text-[#FF6B35]' : 'text-gray-400'}`}>{dayLabels[day.getDay()]}</span>
                  <span className={`text-xs ${isToday ? 'font-bold text-gray-900' : 'text-gray-400'}`}>{day.getDate()}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${dotColor} ${isToday && !checkin ? 'border-2 border-dashed border-[#FF6B35] bg-transparent' : ''}`}>
                    {checkin && <span className="text-white text-xs font-bold">{checkin.mood === 'great' ? '\u2713' : checkin.mood === 'ok' ? '-' : '!'}</span>}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 mt-3 justify-center">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-400" /><span className="text-xs text-gray-400">Great</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-400" /><span className="text-xs text-gray-400">OK</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-400" /><span className="text-xs text-gray-400">Not great</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-gray-200" /><span className="text-xs text-gray-400">Missed</span></div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="text-xs text-gray-500 mb-1">Avg Check-in</p>
            <p className="text-lg font-bold text-gray-900">{avgCheckinTime || '--'}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="text-xs text-gray-500 mb-1">This Month</p>
            <p className="text-lg font-bold text-[#FF6B35]">{monthTotal}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="text-xs text-gray-500 mb-1">Mood Split</p>
            <div className="flex justify-center gap-1 mt-1">
              {totalMoods > 0 ? (
                <>
                  <div className="h-4 bg-green-400 rounded" style={{ width: `${Math.max((moodDist.great / totalMoods) * 50, 2)}px` }} title={`Great: ${moodDist.great}`} />
                  <div className="h-4 bg-yellow-400 rounded" style={{ width: `${Math.max((moodDist.ok / totalMoods) * 50, 2)}px` }} title={`OK: ${moodDist.ok}`} />
                  <div className="h-4 bg-red-400 rounded" style={{ width: `${Math.max((moodDist.not_great / totalMoods) * 50, 2)}px` }} title={`Not great: ${moodDist.not_great}`} />
                </>
              ) : (
                <span className="text-xs text-gray-400">No data</span>
              )}
            </div>
          </div>
        </div>

        {/* Today's Question Answer */}
        {todayAnswer && (
          <div className="bg-gradient-to-r from-[#4ECDC4] to-[#45b7aa] rounded-2xl p-5 text-white shadow-sm">
            <p className="text-xs opacity-80 mb-1">Today&apos;s Question</p>
            <p className="text-sm font-medium mb-2">&ldquo;{todayAnswer.question}&rdquo;</p>
            <p className="text-base">{todayAnswer.answer}</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-5 gap-2">
          {parentUser?.phone && (
            <a href={`tel:${parentUser.phone}`} className="bg-white rounded-2xl p-3 shadow-sm text-center hover:shadow-md transition-shadow">
              <div className="text-xl mb-1">{'\u{1F4DE}'}</div>
              <p className="text-xs font-medium text-gray-700">Call</p>
            </a>
          )}
          <Link href="/dashboard/messages" className="bg-white rounded-2xl p-3 shadow-sm text-center hover:shadow-md transition-shadow">
            <div className="text-xl mb-1">{'\u{1F4AC}'}</div>
            <p className="text-xs font-medium text-gray-700">Message</p>
          </Link>
          <Link href="/dashboard/health" className="bg-white rounded-2xl p-3 shadow-sm text-center hover:shadow-md transition-shadow">
            <div className="text-xl mb-1">{'\u{1F3CB}'}</div>
            <p className="text-xs font-medium text-gray-700">Health</p>
          </Link>
          <Link href="/dashboard/insights" className="bg-white rounded-2xl p-3 shadow-sm text-center hover:shadow-md transition-shadow">
            <div className="text-xl mb-1">{'\u{1F4A1}'}</div>
            <p className="text-xs font-medium text-gray-700">Insights</p>
          </Link>
          <Link href="/dashboard/settings" className="bg-white rounded-2xl p-3 shadow-sm text-center hover:shadow-md transition-shadow">
            <div className="text-xl mb-1">{'\u2699\uFE0F'}</div>
            <p className="text-xs font-medium text-gray-700">Settings</p>
          </Link>
        </div>

        {/* Messages Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
            <Link href="/dashboard/messages" className="text-xs text-[#FF6B35] font-medium">View all</Link>
          </div>
          <form onSubmit={handleSendMessage} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Send a message..."
              className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] text-sm text-gray-900"
            />
            <button
              type="submit"
              disabled={sendingMsg || !newMessage.trim()}
              className="bg-[#FF6B35] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#e55a2b] transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </form>
          {messages.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No messages yet. Send the first one!</p>
          ) : (
            <div className="space-y-3">
              {messages.slice(0, 3).map((msg) => (
                <div key={msg.id} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-[#4ECDC4] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(msg.sender_name || msg.sender_id).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{msg.content}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(msg.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* More Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/dashboard/calls" className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">{'\u{1F399}'}</div>
            <p className="text-sm font-semibold text-gray-900">Voice Calls</p>
            <p className="text-xs text-gray-400 mt-1">AI call summaries</p>
          </Link>
          <Link href="/dashboard/memory-book" className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">{'\u{1F4D6}'}</div>
            <p className="text-sm font-semibold text-gray-900">Memory Book</p>
            <p className="text-xs text-gray-400 mt-1">Daily stories</p>
          </Link>
        </div>

        {/* Voice Cloning Setup */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{'\uD83C\uDFA4'}</span>
              <h3 className="text-lg font-semibold text-gray-900">Voice Cloning</h3>
            </div>
            <span className="text-xs text-gray-400">
              {voiceProfiles.length} voice{voiceProfiles.length !== 1 ? 's' : ''} created
            </span>
          </div>
          {voiceProfiles.length > 0 ? (
            <div className="space-y-2 mb-4">
              {voiceProfiles.map((vp) => (
                <div key={vp.id} className="flex items-center justify-between bg-[#FFF8F0] rounded-xl px-4 py-3">
                  <span className="text-sm font-medium text-gray-900">{vp.voice_name}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    vp.status === 'ready'
                      ? 'bg-green-100 text-green-700'
                      : vp.status === 'processing'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {vp.status === 'ready' ? 'Ready' : vp.status === 'processing' ? 'Processing...' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-4">No voices set up yet. Clone a voice so your parent can hear stories in a familiar voice.</p>
          )}
          <Link
            href="/dashboard/voice-setup"
            className="block w-full bg-[#4ECDC4] text-white py-3 rounded-xl text-center font-semibold text-sm hover:bg-[#3dbdb5] transition-colors"
          >
            {voiceProfiles.length > 0 ? 'Manage Voices' : 'Set up a voice'}
          </Link>
        </div>

        {/* Invite Family Card */}
        <Link href="/dashboard/invite" className="block bg-gradient-to-r from-[#FF6B35] to-[#ff8a5c] rounded-2xl p-5 text-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Invite Family Members</p>
              <p className="text-sm opacity-80 mt-1">Share your family code and stay connected</p>
            </div>
            <span className="text-2xl">{'\u{1F46A}'}</span>
          </div>
        </Link>
      </div>
    </div>
  )
}
