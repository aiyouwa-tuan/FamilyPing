'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { User, Family } from '@/lib/types'

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [family, setFamily] = useState<Family | null>(null)
  const [members, setMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
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

    // Get family
    const { data: familyData } = await supabase
      .from('families')
      .select('*')
      .eq('id', userData.family_id)
      .limit(1)
      .single()

    if (familyData) setFamily(familyData)

    // Get family members
    const { data: membersData } = await supabase
      .from('users')
      .select('*')
      .eq('family_id', userData.family_id)
      .order('created_at', { ascending: true })

    if (membersData) setMembers(membersData)

    setLoading(false)
  }, [supabase, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function copyInviteCode() {
    if (family?.invite_code) {
      navigator.clipboard.writeText(family.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] py-8">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

        {/* Profile */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500">Name</span>
              <span className="text-sm font-medium text-gray-900">{currentUser?.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-gray-100">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-sm font-medium text-gray-900">{currentUser?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-gray-100">
              <span className="text-sm text-gray-500">Role</span>
              <span className="text-sm font-medium text-gray-900 capitalize">
                {currentUser?.role === 'family_member' ? 'Family Member' : 'Parent'}
              </span>
            </div>
          </div>
        </div>

        {/* Family */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Family</h3>
          {family ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">Family Name</span>
                <span className="text-sm font-medium text-gray-900">{family.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-t border-gray-100">
                <span className="text-sm text-gray-500">Invite Code</span>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono text-[#FF6B35]">
                    {family.invite_code}
                  </code>
                  <button
                    onClick={copyInviteCode}
                    className="text-xs text-gray-500 hover:text-[#FF6B35] transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500 mb-3">Members ({members.length})</p>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#4ECDC4] flex items-center justify-center text-white text-xs font-bold">
                          {member.name.charAt(0).toUpperCase()}
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
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No family found.</p>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between py-2 cursor-pointer">
              <span className="text-sm text-gray-600">Daily check-in reminders</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#FF6B35] rounded" />
            </label>
            <label className="flex items-center justify-between py-2 border-t border-gray-100 cursor-pointer">
              <span className="text-sm text-gray-600">Missed check-in alerts</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#FF6B35] rounded" />
            </label>
            <label className="flex items-center justify-between py-2 border-t border-gray-100 cursor-pointer">
              <span className="text-sm text-gray-600">SOS notifications</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#FF6B35] rounded" />
            </label>
            <label className="flex items-center justify-between py-2 border-t border-gray-100 cursor-pointer">
              <span className="text-sm text-gray-600">Weekly summary emails</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#FF6B35] rounded" />
            </label>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full bg-white text-red-500 py-3 rounded-2xl font-semibold shadow-sm hover:bg-red-50 transition-colors border border-red-200"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
