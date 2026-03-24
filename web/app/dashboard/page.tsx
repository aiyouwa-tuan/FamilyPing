'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { User, Message, Checkin, Mood } from '@/lib/types'
import ParentStatusCard from '@/components/ParentStatusCard'
import WeekCalendar from '@/components/WeekCalendar'

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [moodDist, setMoodDist] = useState<Record<Mood, number>>({ great: 0, ok: 0, not_great: 0 })
  const [avgCheckinTime, setAvgCheckinTime] = useState<string | null>(null)
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

    // Get user record
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

    // Get messages
    const { data: msgData } = await supabase
      .from('messages')
      .select('*')
      .eq('family_id', userData.family_id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (msgData) setMessages(msgData)

    // Get mood distribution (last 30 days)
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
      if (count > 0) {
        const avgMin = Math.round(totalMinutes / count)
        const h = Math.floor(avgMin / 60)
        const m = avgMin % 60
        const period = h >= 12 ? 'PM' : 'AM'
        const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h
        setAvgCheckinTime(`${hour12}:${m.toString().padStart(2, '0')} ${period}`)
      }
    }

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
          role: userRole,
          name: userName.trim(),
          phone: authUser.email || '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          checkin_time: userRole === 'parent' ? '09:00' : null,
        })

      if (userErr) { alert('Failed to create user: ' + userErr.message); setCreatingFamily(false); return }
      fetchData()
    } catch (err) {
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
        role: authUser.user_metadata?.role || 'family_member',
        email: authUser.email || '',
      })
      fetchData()
    }
    setJoiningFamily(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // No family yet - show join/create flow
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] py-12">
        <div className="max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Welcome to FamilyPing</h1>
          {/* Create Family */}
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

          <div className="text-center text-gray-400 text-sm mb-4">— or —</div>

          {/* Join Family */}
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

  return (
    <div className="min-h-screen bg-[#FFF8F0] py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back, {currentUser.name}</p>
        </div>

        {/* Parent Status */}
        <ParentStatusCard familyId={currentUser.family_id} />

        {/* Week Calendar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <WeekCalendar userId={currentUser.id} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
            <p className="text-xs text-gray-500 mb-1">Avg Check-in</p>
            <p className="text-lg font-bold text-gray-900">{avgCheckinTime || '--'}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
            <p className="text-xs text-gray-500 mb-1">Total Check-ins</p>
            <p className="text-lg font-bold text-[#FF6B35]">{totalMoods}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
            <p className="text-xs text-gray-500 mb-1">Mood Split</p>
            <div className="flex justify-center gap-1 mt-1">
              {totalMoods > 0 ? (
                <>
                  <div className="h-4 bg-green-400 rounded" style={{ width: `${(moodDist.great / totalMoods) * 60}px` }} />
                  <div className="h-4 bg-yellow-400 rounded" style={{ width: `${(moodDist.ok / totalMoods) * 60}px` }} />
                  <div className="h-4 bg-red-400 rounded" style={{ width: `${(moodDist.not_great / totalMoods) * 60}px` }} />
                </>
              ) : (
                <span className="text-sm text-gray-400">No data</span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-3 gap-4">
          <Link href="/dashboard/health" className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow text-center group">
            <div className="text-2xl mb-2">{'\u{1F3CB}'}</div>
            <p className="text-sm font-medium text-gray-900 group-hover:text-[#FF6B35]">Health</p>
          </Link>
          <Link href="/dashboard/insights" className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow text-center group">
            <div className="text-2xl mb-2">{'\u{1F4A1}'}</div>
            <p className="text-sm font-medium text-gray-900 group-hover:text-[#FF6B35]">Insights</p>
          </Link>
          <Link href="/dashboard/settings" className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow text-center group">
            <div className="text-2xl mb-2">{'\u2699\uFE0F'}</div>
            <p className="text-sm font-medium text-gray-900 group-hover:text-[#FF6B35]">Settings</p>
          </Link>
        </div>

        {/* Send Message */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Send a Message</h3>
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Write a message to your family..."
              className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] text-gray-900"
            />
            <button
              type="submit"
              disabled={sendingMsg || !newMessage.trim()}
              className="bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#e55a2b] transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>

        {/* Recent Messages */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Messages</h3>
          {messages.length === 0 ? (
            <p className="text-gray-400 text-sm">No messages yet. Send the first one!</p>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-[#4ECDC4] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {msg.sender_id.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{msg.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
