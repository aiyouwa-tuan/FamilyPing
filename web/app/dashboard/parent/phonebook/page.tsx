'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { User } from '@/lib/types'

interface EmergencyContact {
  name: string
  number: string
  icon: string
}

const emergencyNumbers: EmergencyContact[] = [
  { name: 'Police', number: '911', icon: '\uD83D\uDE93' },
  { name: 'Fire Dept', number: '911', icon: '\uD83D\uDE92' },
  { name: 'Ambulance', number: '911', icon: '\uD83D\uDE91' },
  { name: 'Poison Control', number: '1-800-222-1222', icon: '\u2622\uFE0F' },
]

export default function PhonebookPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [familyMembers, setFamilyMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
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

    // Get family members (same family_id, excluding self)
    const { data: members } = await supabase
      .from('users')
      .select('*')
      .eq('family_id', userData.family_id)
      .neq('id', userData.id)
      .order('name', { ascending: true })

    if (members) setFamilyMembers(members)
    setLoading(false)
  }, [supabase, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function handleCall(phone: string) {
    window.open(`tel:${phone}`, '_self')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="animate-pulse text-[#FF6B35] text-[24px] font-bold">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-10">
      <div className="max-w-lg mx-auto px-5 pt-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/parent"
            className="w-[52px] h-[52px] bg-white rounded-2xl flex items-center justify-center shadow-sm border border-orange-100 text-[24px] active:scale-95"
          >
            {'\u2190'}
          </Link>
          <h1 className="text-[32px] font-bold text-gray-900">Phonebook</h1>
        </div>

        {/* Family Members */}
        <div>
          <h2 className="text-[22px] font-semibold text-gray-700 mb-4">Family Members</h2>
          {familyMembers.length === 0 ? (
            <div className="bg-white rounded-3xl p-7 shadow-sm border border-orange-100 text-center">
              <p className="text-[20px] text-gray-400">
                No other family members yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {familyMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-3xl p-5 shadow-sm border border-orange-100 flex items-center gap-5"
                >
                  {/* Avatar */}
                  <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-[#FF6B35] to-[#ff8c5c] flex items-center justify-center text-white text-[32px] font-bold shrink-0">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  {/* Name + Role */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[24px] font-bold text-gray-900 truncate">{member.name}</p>
                    <p className="text-[18px] text-gray-500 capitalize">{member.role.replace('_', ' ')}</p>
                  </div>
                  {/* Call button */}
                  {member.phone && (
                    <button
                      onClick={() => handleCall(member.phone!)}
                      className="bg-green-500 hover:bg-green-600 active:scale-95 text-white px-6 py-4 rounded-2xl font-bold text-[20px] min-h-[64px] min-w-[100px] transition-colors shadow-sm flex items-center gap-2"
                    >
                      <span className="text-[24px]">{'\uD83D\uDCDE'}</span>
                      Call
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emergency Numbers */}
        <div>
          <h2 className="text-[22px] font-semibold text-red-600 mb-4">
            Emergency Numbers
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {emergencyNumbers.map((contact) => (
              <button
                key={contact.name}
                onClick={() => handleCall(contact.number)}
                className="bg-white rounded-3xl p-6 shadow-sm border-2 border-red-200 hover:border-red-400 hover:bg-red-50 active:scale-95 transition-all text-center min-h-[120px] flex flex-col items-center justify-center gap-2"
              >
                <span className="text-[40px]">{contact.icon}</span>
                <p className="text-[20px] font-bold text-gray-900">{contact.name}</p>
                <p className="text-[18px] text-red-600 font-semibold">{contact.number}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
