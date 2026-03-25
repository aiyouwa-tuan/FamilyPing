'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Check URL hash for error
    const hash = window.location.hash
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.substring(1))
      setError(params.get('error_description') || params.get('error') || 'Login failed')
      return
    }

    // With implicit flow, Supabase auto-detects tokens in the URL hash
    // and creates a session. We just need to wait for it.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          subscription.unsubscribe()
          window.location.href = '/dashboard'
        }
      }
    )

    // Also check if session already exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe()
        window.location.href = '/dashboard'
      }
    })

    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      subscription.unsubscribe()
      setError('Login timed out. Please try again.')
    }, 10000)

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Login Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <a href="/auth/login" className="inline-block bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#e55a2b]">
            Try Again
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
