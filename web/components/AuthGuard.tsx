'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function AuthGuard({ children }: { children: (user: User) => React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        setLoading(false)
      } else {
        window.location.href = '/auth/login'
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
        setLoading(false)
      } else if (event === 'SIGNED_OUT') {
        window.location.href = '/auth/login'
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6B35]"></div>
      </div>
    )
  }

  return <>{user && children(user)}</>
}
