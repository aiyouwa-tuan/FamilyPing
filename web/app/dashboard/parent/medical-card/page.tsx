'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface MedicalInfo {
  fullName: string
  dateOfBirth: string
  bloodType: string
  allergies: string
  medications: string
  emergencyContactName: string
  emergencyContactPhone: string
  doctorName: string
  doctorPhone: string
  insurance: string
  notes: string
}

const STORAGE_KEY = 'familyping_medical_card'

const defaultMedicalInfo: MedicalInfo = {
  fullName: '',
  dateOfBirth: '',
  bloodType: '',
  allergies: '',
  medications: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  doctorName: '',
  doctorPhone: '',
  insurance: '',
  notes: '',
}

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function MedicalCardPage() {
  const [info, setInfo] = useState<MedicalInfo>(defaultMedicalInfo)
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

    // Load from localStorage
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setInfo(JSON.parse(stored))
      } catch {
        // ignore parse errors
      }
    }

    // Also try to prefill name from Supabase user record
    const { data: userData } = await supabase
      .from('users')
      .select('name')
      .eq('auth_id', authUser.id)
      .limit(1)
      .single()

    if (userData && !stored) {
      setInfo((prev) => ({ ...prev, fullName: userData.name || '' }))
    }

    setLoading(false)
  }, [supabase, router])

  useEffect(() => {
    loadData()
  }, [loadData])

  function handleChange(field: keyof MedicalInfo, value: string) {
    setInfo((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  async function handleSave() {
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info))

    // Also save to Supabase user metadata (optional, best-effort)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        await supabase.auth.updateUser({
          data: { medical_card: info },
        })
      }
    } catch {
      // Silently fail on Supabase save
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
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
          <div className="flex items-center gap-3">
            <div className="w-[48px] h-[48px] bg-red-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-[28px] font-bold">{'\u271A'}</span>
            </div>
            <h1 className="text-[30px] font-bold text-gray-900">Medical Card</h1>
          </div>
        </div>

        {/* Important Note */}
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-5">
          <p className="text-[18px] text-red-700 font-medium leading-relaxed">
            Keep this card updated. In an emergency, first responders can use this information.
          </p>
        </div>

        {/* Personal Info */}
        <div className="bg-white rounded-3xl p-7 shadow-sm border border-orange-100 space-y-5">
          <h2 className="text-[24px] font-bold text-gray-900">Personal Information</h2>

          <div>
            <label className="block text-[18px] font-semibold text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={info.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Your full name"
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent text-[20px] text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-[18px] font-semibold text-gray-700 mb-2">Date of Birth</label>
            <input
              type="date"
              value={info.dateOfBirth}
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent text-[20px] text-gray-900"
            />
          </div>

          <div>
            <label className="block text-[18px] font-semibold text-gray-700 mb-2">Blood Type</label>
            <div className="grid grid-cols-4 gap-3">
              {bloodTypes.map((bt) => (
                <button
                  key={bt}
                  onClick={() => handleChange('bloodType', bt)}
                  className={`py-3 rounded-2xl font-bold text-[20px] border-2 transition-all min-h-[56px] active:scale-95 ${
                    info.bloodType === bt
                      ? 'border-red-500 bg-red-50 text-red-600'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {bt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Medical Details */}
        <div className="bg-white rounded-3xl p-7 shadow-sm border border-orange-100 space-y-5">
          <h2 className="text-[24px] font-bold text-gray-900">Medical Details</h2>

          <div>
            <label className="block text-[18px] font-semibold text-gray-700 mb-2">Allergies</label>
            <textarea
              value={info.allergies}
              onChange={(e) => handleChange('allergies', e.target.value)}
              placeholder="List any allergies (food, medicine, etc.)"
              rows={2}
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent text-[20px] text-gray-900 placeholder:text-gray-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-[18px] font-semibold text-gray-700 mb-2">Current Medications</label>
            <textarea
              value={info.medications}
              onChange={(e) => handleChange('medications', e.target.value)}
              placeholder="List current medications and dosages"
              rows={3}
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent text-[20px] text-gray-900 placeholder:text-gray-400 resize-none"
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-3xl p-7 shadow-sm border border-orange-100 space-y-5">
          <h2 className="text-[24px] font-bold text-gray-900">Emergency Contact</h2>

          <div>
            <label className="block text-[18px] font-semibold text-gray-700 mb-2">Contact Name</label>
            <input
              type="text"
              value={info.emergencyContactName}
              onChange={(e) => handleChange('emergencyContactName', e.target.value)}
              placeholder="Emergency contact name"
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent text-[20px] text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-[18px] font-semibold text-gray-700 mb-2">Contact Phone</label>
            <input
              type="tel"
              value={info.emergencyContactPhone}
              onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
              placeholder="Emergency contact phone"
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent text-[20px] text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Doctor Info */}
        <div className="bg-white rounded-3xl p-7 shadow-sm border border-orange-100 space-y-5">
          <h2 className="text-[24px] font-bold text-gray-900">Doctor Information</h2>

          <div>
            <label className="block text-[18px] font-semibold text-gray-700 mb-2">Doctor Name</label>
            <input
              type="text"
              value={info.doctorName}
              onChange={(e) => handleChange('doctorName', e.target.value)}
              placeholder="Primary doctor name"
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent text-[20px] text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-[18px] font-semibold text-gray-700 mb-2">Doctor Phone</label>
            <input
              type="tel"
              value={info.doctorPhone}
              onChange={(e) => handleChange('doctorPhone', e.target.value)}
              placeholder="Doctor phone number"
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent text-[20px] text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-[18px] font-semibold text-gray-700 mb-2">Insurance Info</label>
            <input
              type="text"
              value={info.insurance}
              onChange={(e) => handleChange('insurance', e.target.value)}
              placeholder="Insurance provider & policy number"
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent text-[20px] text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Additional Notes */}
        <div className="bg-white rounded-3xl p-7 shadow-sm border border-orange-100 space-y-5">
          <h2 className="text-[24px] font-bold text-gray-900">Additional Notes</h2>
          <textarea
            value={info.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Any other important medical info (conditions, surgical history, etc.)"
            rows={4}
            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent text-[20px] text-gray-900 placeholder:text-gray-400 resize-none"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className={`w-full py-5 rounded-3xl font-bold text-[24px] min-h-[72px] transition-all active:scale-[0.98] shadow-md ${
            saved
              ? 'bg-green-500 text-white shadow-green-500/30'
              : 'bg-[#FF6B35] text-white hover:bg-[#e55a2b] shadow-[#FF6B35]/30'
          }`}
        >
          {saved ? 'Saved!' : 'Save Medical Card'}
        </button>
      </div>
    </div>
  )
}
