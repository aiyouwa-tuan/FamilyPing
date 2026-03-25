'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Auth callback error:', error.message)
        setError(error.message)
        return
      }

      if (data.session) {
        router.push('/dashboard')
        router.refresh()
        return
      }

      // If no session yet, wait for the auth state change
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe()
          router.push('/dashboard')
          router.refresh()
        }
      })

      // Timeout after 10 seconds
      setTimeout(() => {
        subscription.unsubscribe()
        setError('Login timed out. Please try again.')
      }, 10000)
    }

    handleCallback()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Login Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <a href="/auth/login" className="text-[#FF6B35] font-medium hover:underline">
            Back to Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35] mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Signing you in...</p>
      </div>
    </div>
  )
}
