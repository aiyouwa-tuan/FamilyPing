'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { User, Family } from '@/lib/types'

export default function InvitePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [family, setFamily] = useState<Family | null>(null)
  const [members, setMembers] = useState<User[]>([])
  const [phoneNumber, setPhoneNumber] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { router.push('/auth/login'); return }

    const { data: userData } = await supabase.from('users').select('*').eq('auth_id', authUser.id).limit(1).single()
    if (!userData) { setLoading(false); return }
    setCurrentUser(userData)

    const { data: familyData } = await supabase.from('families').select('*').eq('id', userData.family_id).limit(1).single()
    if (familyData) setFamily(familyData)

    const { data: membersData } = await supabase.from('users').select('*').eq('family_id', userData.family_id).order('created_at', { ascending: true })
    if (membersData) setMembers(membersData)

    setLoading(false)
  }, [supabase, router])

  useEffect(() => { fetchData() }, [fetchData])

  function copyCode() {
    if (family?.invite_code) {
      navigator.clipboard.writeText(family.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleSendSMS() {
    if (!phoneNumber.trim()) return
    // Open SMS with pre-filled message
    const message = `Join our family on FamilyPing! Use invite code: ${family?.invite_code || ''}\n\nDownload the app at familyping.com`
    window.open(`sms:${phoneNumber}?body=${encodeURIComponent(message)}`, '_blank')
    setPhoneNumber('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  const isFree = !family?.plan || family.plan === 'free'

  return (
    <div className="min-h-screen bg-[#FFF8F0] py-8 pb-24">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">{'\u2190'}</Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invite Family</h1>
            <p className="text-sm text-gray-500">Grow your family circle</p>
          </div>
        </div>

        {/* Invite Code Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Family Invite Code</h3>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-[#FFF8F0] px-5 py-4 rounded-xl text-2xl font-mono font-bold text-[#FF6B35] text-center tracking-widest">
              {family?.invite_code || '------'}
            </code>
            <button
              onClick={copyCode}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-[#FF6B35] text-white hover:bg-[#e55a2b]'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">Share this code with family members to let them join</p>
        </div>

        {/* SMS Invite */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Invite by SMS</h3>
          <div className="flex gap-2">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Phone number"
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] text-sm text-gray-900"
            />
            <button
              onClick={handleSendSMS}
              disabled={!phoneNumber.trim()}
              className="bg-[#4ECDC4] text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-[#3dbdb5] transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>

        {/* Family Members */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Family Members ({members.length})</h3>
          {members.length === 0 ? (
            <p className="text-gray-400 text-sm">No members yet.</p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#4ECDC4] flex items-center justify-center text-white font-bold">
                      {member.avatar_emoji || member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-400">{member.email}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500 capitalize">
                    {member.role === 'family_member' ? 'Family' : 'Parent'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Free Plan Warning */}
        {isFree && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <span className="text-xl">{'\u26A0\uFE0F'}</span>
              <div>
                <p className="text-sm font-semibold text-yellow-800">Family Plan Required</p>
                <p className="text-sm text-yellow-700 mt-1">
                  The free plan supports 1 parent + 1 family member. Upgrade to add more members and unlock premium features.
                </p>
                <Link
                  href="/dashboard/paywall"
                  className="inline-block mt-3 bg-[#FF6B35] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#e55a2b] transition-colors"
                >
                  Upgrade Plan
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
