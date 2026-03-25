'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { User, Family } from '@/lib/types'

interface PlanTier {
  name: string
  monthlyPrice: number
  annualPrice: number
  features: string[]
  highlight?: boolean
  planKey: string
}

const plans: PlanTier[] = [
  {
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    planKey: 'free',
    features: [
      '1 parent + 1 family member',
      'Daily check-ins',
      'Basic mood tracking',
      'Text messages',
    ],
  },
  {
    name: 'Family',
    monthlyPrice: 4.99,
    annualPrice: 39.99,
    planKey: 'family',
    features: [
      'Up to 5 family members',
      'Everything in Free',
      '7-day health history',
      'Weekly AI summaries',
      'Family group chat',
    ],
  },
  {
    name: 'Smart',
    monthlyPrice: 9.99,
    annualPrice: 79.99,
    planKey: 'smart',
    highlight: true,
    features: [
      'Up to 10 family members',
      'Everything in Family',
      'AI daily insights',
      'Health anomaly alerts',
      'Memory book',
      'AI chat assistant',
    ],
  },
  {
    name: 'Premium',
    monthlyPrice: 14.99,
    annualPrice: 119.99,
    planKey: 'premium',
    features: [
      'Unlimited family members',
      'Everything in Smart',
      'AI voice calls',
      'Conversation memory',
      'Advanced analytics',
      'Priority support',
      'Custom check-in schedules',
    ],
  },
]

export default function PaywallPage() {
  const [currentPlan, setCurrentPlan] = useState<string>('free')
  const [isAnnual, setIsAnnual] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { router.push('/auth/login'); return }

    const { data: userData } = await supabase.from('users').select('*').eq('auth_id', authUser.id).limit(1).single()
    if (!userData) { setLoading(false); return }

    const { data: familyData } = await supabase.from('families').select('plan').eq('id', userData.family_id).limit(1).single()
    if (familyData?.plan) setCurrentPlan(familyData.plan)

    setLoading(false)
  }, [supabase, router])

  useEffect(() => { fetchData() }, [fetchData])

  function handleSubscribe(planKey: string) {
    if (planKey === currentPlan) return
    alert(`Subscription to ${planKey} plan coming soon! Payment integration will be available in a future update.`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading plans...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] py-8 pb-24">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">{'\u2190'}</Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Upgrade Plan</h1>
            <p className="text-sm text-gray-500">Choose the right plan for your family</p>
          </div>
        </div>

        {/* Annual Toggle */}
        <div className="flex items-center justify-center gap-3 bg-white rounded-2xl p-4 shadow-sm">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-400'}`}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-12 h-6 rounded-full transition-colors ${isAnnual ? 'bg-[#FF6B35]' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-400'}`}>Annual</span>
          {isAnnual && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Save 33%</span>}
        </div>

        {/* Plan Cards */}
        <div className="space-y-4">
          {plans.map((plan) => {
            const isCurrentPlan = plan.planKey === currentPlan
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice
            const period = isAnnual ? '/year' : '/month'

            return (
              <div
                key={plan.planKey}
                className={`rounded-2xl p-6 shadow-sm relative ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#ff8a5c] text-white'
                    : isCurrentPlan
                    ? 'bg-white border-2 border-[#FF6B35]'
                    : 'bg-white'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-2 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-0.5 rounded-full">
                    Most Popular
                  </span>
                )}
                {isCurrentPlan && !plan.highlight && (
                  <span className="absolute -top-2 right-4 bg-[#FF6B35] text-white text-xs font-bold px-3 py-0.5 rounded-full">
                    Current Plan
                  </span>
                )}

                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-lg font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                  <div className="text-right">
                    <span className={`text-2xl font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                      {price === 0 ? 'Free' : `$${price.toFixed(2)}`}
                    </span>
                    {price > 0 && (
                      <span className={`text-xs ${plan.highlight ? 'text-white/70' : 'text-gray-400'}`}>{period}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className={`text-sm flex items-start gap-2 ${plan.highlight ? 'text-white/90' : 'text-gray-600'}`}>
                      <span className={`mt-0.5 ${plan.highlight ? 'text-white' : 'text-[#4ECDC4]'}`}>{'\u2713'}</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.planKey)}
                  disabled={isCurrentPlan}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isCurrentPlan
                      ? plan.highlight ? 'bg-white/30 text-white cursor-default' : 'bg-gray-100 text-gray-400 cursor-default'
                      : plan.highlight
                      ? 'bg-white text-[#FF6B35] hover:bg-white/90'
                      : 'bg-[#FF6B35] text-white hover:bg-[#e55a2b]'
                  }`}
                >
                  {isCurrentPlan ? 'Current Plan' : plan.planKey === 'free' ? 'Downgrade' : 'Subscribe'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
