'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { User, Family } from '@/lib/types'

const avatarEmojis = ['\u{1F468}', '\u{1F469}', '\u{1F9D1}', '\u{1F474}', '\u{1F475}', '\u{1F466}', '\u{1F467}', '\u{1F47B}', '\u{1F431}', '\u{1F436}', '\u{1F60E}', '\u{1F913}']

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [family, setFamily] = useState<Family | null>(null)
  const [members, setMembers] = useState<User[]>([])
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [notifications, setNotifications] = useState({
    checkin_reminders: true,
    missed_alerts: true,
    sos_notifications: true,
    weekly_summary: true,
  })
  const [alertDelay, setAlertDelay] = useState('30')
  const router = useRouter()
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { router.push('/auth/login'); return }

    const { data: userData } = await supabase.from('users').select('*').eq('auth_id', authUser.id).limit(1).single()
    if (!userData) { setLoading(false); return }
    setCurrentUser(userData)
    setNameInput(userData.name)

    const { data: familyData } = await supabase.from('families').select('*').eq('id', userData.family_id).limit(1).single()
    if (familyData) setFamily(familyData)

    const { data: membersData } = await supabase.from('users').select('*').eq('family_id', userData.family_id).order('created_at', { ascending: true })
    if (membersData) setMembers(membersData)

    // Load notification settings from localStorage
    try {
      const saved = localStorage.getItem('fp_notifications')
      if (saved) setNotifications(JSON.parse(saved))
      const savedDelay = localStorage.getItem('fp_alert_delay')
      if (savedDelay) setAlertDelay(savedDelay)
    } catch { /* ignore */ }

    setLoading(false)
  }, [supabase, router])

  useEffect(() => { fetchData() }, [fetchData])

  async function saveName() {
    if (!currentUser || !nameInput.trim()) return
    const { error } = await supabase.from('users').update({ name: nameInput.trim() }).eq('id', currentUser.id)
    if (!error) {
      setCurrentUser({ ...currentUser, name: nameInput.trim() })
      setEditingName(false)
    }
  }

  async function selectEmoji(emoji: string) {
    if (!currentUser) return
    const { error } = await supabase.from('users').update({ avatar_emoji: emoji }).eq('id', currentUser.id)
    if (!error) {
      setCurrentUser({ ...currentUser, avatar_emoji: emoji })
      setShowEmojiPicker(false)
    }
  }

  function toggleNotification(key: keyof typeof notifications) {
    const updated = { ...notifications, [key]: !notifications[key] }
    setNotifications(updated)
    localStorage.setItem('fp_notifications', JSON.stringify(updated))
  }

  function updateAlertDelay(val: string) {
    setAlertDelay(val)
    localStorage.setItem('fp_alert_delay', val)
  }

  function copyInviteCode() {
    if (family?.invite_code) {
      navigator.clipboard.writeText(family.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] py-8 pb-24">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">{'\u2190'}</Link>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        </div>

        {/* Profile */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Profile</h3>
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-16 h-16 rounded-full bg-[#FFF8F0] flex items-center justify-center text-3xl hover:bg-[#FFE8D6] transition-colors">
              {currentUser?.avatar_emoji || currentUser?.name.charAt(0).toUpperCase() || '?'}
            </button>
            <div className="flex-1">
              {editingName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] text-sm text-gray-900"
                  />
                  <button onClick={saveName} className="text-sm text-[#FF6B35] font-medium">Save</button>
                  <button onClick={() => { setEditingName(false); setNameInput(currentUser?.name || '') }} className="text-sm text-gray-400">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-gray-900">{currentUser?.name}</p>
                  <button onClick={() => setEditingName(true)} className="text-xs text-[#FF6B35]">Edit</button>
                </div>
              )}
              <p className="text-sm text-gray-500">{currentUser?.email}</p>
            </div>
          </div>
          {showEmojiPicker && (
            <div className="bg-[#FFF8F0] rounded-xl p-3 grid grid-cols-6 gap-2">
              {avatarEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => selectEmoji(emoji)}
                  className={`text-2xl p-2 rounded-lg hover:bg-white transition-colors ${currentUser?.avatar_emoji === emoji ? 'bg-white shadow-sm' : ''}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Family Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Family</h3>
          {family ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">Family Name</span>
                <span className="text-sm font-medium text-gray-900">{family.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-t border-gray-100">
                <span className="text-sm text-gray-500">Invite Code</span>
                <div className="flex items-center gap-2">
                  <code className="bg-[#FFF8F0] px-3 py-1 rounded text-sm font-mono text-[#FF6B35]">{family.invite_code}</code>
                  <button onClick={copyInviteCode} className="text-xs text-gray-500 hover:text-[#FF6B35]">{copied ? 'Copied!' : 'Copy'}</button>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-sm text-gray-500 mb-2">Members ({members.length})</p>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#4ECDC4] flex items-center justify-center text-white text-xs font-bold">
                          {member.avatar_emoji || member.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-900">{member.name}</span>
                      </div>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">{member.role === 'family' ? 'Family' : 'Parent'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No family found.</p>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Notifications</h3>
          <div className="space-y-1">
            {[
              { key: 'checkin_reminders' as const, label: 'Daily check-in reminders' },
              { key: 'missed_alerts' as const, label: 'Missed check-in alerts' },
              { key: 'sos_notifications' as const, label: 'SOS notifications' },
              { key: 'weekly_summary' as const, label: 'Weekly summary emails' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 cursor-pointer">
                <span className="text-sm text-gray-600">{label}</span>
                <button
                  onClick={() => toggleNotification(key)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${notifications[key] ? 'bg-[#FF6B35]' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifications[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </label>
            ))}
          </div>
        </div>

        {/* Alert Delay */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Alert Delay</h3>
          <p className="text-xs text-gray-400 mb-3">How long after a missed check-in before alerting family members</p>
          <select
            value={alertDelay}
            onChange={(e) => updateAlertDelay(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
            <option value="240">4 hours</option>
          </select>
        </div>

        {/* Plan Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Plan</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 capitalize">{family?.plan || 'Free'} Plan</p>
              <p className="text-xs text-gray-400">
                {family?.plan === 'premium' ? 'All features unlocked' : 'Upgrade for more features'}
              </p>
            </div>
            {family?.plan !== 'premium' && (
              <Link href="/dashboard/paywall" className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#e55a2b] transition-colors">
                Upgrade
              </Link>
            )}
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full bg-white text-red-500 py-3.5 rounded-2xl font-semibold shadow-sm hover:bg-red-50 transition-colors border border-red-200"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
