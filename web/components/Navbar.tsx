'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface NavbarProps {
  user: SupabaseUser | null
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#FF6B35]">FamilyPing</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-[#FF6B35] transition-colors">
              Dashboard
            </Link>
            <Link href="/dashboard/health" className="text-sm text-gray-600 hover:text-[#FF6B35] transition-colors">
              Health
            </Link>
            <Link href="/dashboard/insights" className="text-sm text-gray-600 hover:text-[#FF6B35] transition-colors">
              Insights
            </Link>
            <Link href="/dashboard/settings" className="text-sm text-gray-600 hover:text-[#FF6B35] transition-colors">
              Settings
            </Link>
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-[#4ECDC4] flex items-center justify-center text-white text-sm font-medium">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-[#FF6B35] transition-colors">
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#e55a2b] transition-colors"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
