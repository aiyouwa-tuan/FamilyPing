'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Suspense } from 'react'

function CallbackHandler() {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error in URL params
        const urlError = searchParams.get('error_description') || searchParams.get('error')
        if (urlError) {
          setError(urlError)
          return
        }

        // Try to get the code from URL and exchange it
        const code = searchParams.get('code')
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError.message)
            // Don't set error yet, try getSession below
          }
        }

        // Check if we have a session (from code exchange or from URL hash tokens)
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          // Force a hard navigation to ensure middleware picks up cookies
          window.location.href = '/dashboard'
          return
        }

        // Listen for auth state changes (handles hash fragment tokens)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
              subscription.unsubscribe()
              window.location.href = '/dashboard'
            }
          }
        )

        // Timeout
        setTimeout(() => {
          subscription.unsubscribe()
          setError('Login timed out. Please try again.')
        }, 15000)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error('Callback error:', message)
        setError(message)
      }
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

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35] mx-auto"></div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}
