'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Tab {
  href: string
  label: string
  iconSrc: string
  matchPaths: string[]
}

const parentTabs: Tab[] = [
  {
    href: '/dashboard/parent',
    label: 'Home',
    iconSrc: '/icons/tab-home.png',
    matchPaths: ['/dashboard/parent'],
  },
  {
    href: '/dashboard/parent/listen',
    label: 'Listen',
    iconSrc: '/icons/tab-listen.png',
    matchPaths: ['/dashboard/parent/listen'],
  },
  {
    href: '/dashboard/parent/watch',
    label: 'Watch',
    iconSrc: '/icons/tab-listen.png',
    matchPaths: ['/dashboard/parent/watch'],
  },
  {
    href: '/dashboard/messages',
    label: 'Messages',
    iconSrc: '/icons/tab-messages.png',
    matchPaths: ['/dashboard/messages'],
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    iconSrc: '/icons/tab-settings.png',
    matchPaths: ['/dashboard/settings'],
  },
]

const familyTabs: Tab[] = [
  {
    href: '/dashboard',
    label: 'Home',
    iconSrc: '/icons/tab-home.png',
    matchPaths: ['/dashboard'],
  },
  {
    href: '/dashboard/health',
    label: 'Health',
    iconSrc: '/icons/tab-health.png',
    matchPaths: ['/dashboard/health'],
  },
  {
    href: '/dashboard/messages',
    label: 'Messages',
    iconSrc: '/icons/tab-messages.png',
    matchPaths: ['/dashboard/messages'],
  },
  {
    href: '/dashboard/insights',
    label: 'Insights',
    iconSrc: '/icons/tab-health.png',
    matchPaths: ['/dashboard/insights'],
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    iconSrc: '/icons/tab-settings.png',
    matchPaths: ['/dashboard/settings'],
  },
]

export default function BottomTabBar() {
  const pathname = usePathname()
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [visible, setVisible] = useState(true)
  const [role, setRole] = useState<'parent' | 'family' | null>(null)

  // Only show on /dashboard/* pages
  const shouldShow = pathname?.startsWith('/dashboard')

  useEffect(() => {
    async function fetchRole() {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', authUser.id)
        .limit(1)
        .single()

      if (userData) {
        setRole(userData.role === 'parent' ? 'parent' : 'family')
      }
    }
    fetchRole()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return

    const viewport = window.visualViewport!
    const initialHeight = viewport.height

    function handleResize() {
      // If viewport shrinks by more than 150px, keyboard is likely open
      const currentHeight = window.visualViewport!.height
      const diff = initialHeight - currentHeight
      setIsKeyboardOpen(diff > 150)
    }

    viewport.addEventListener('resize', handleResize)
    return () => viewport.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setVisible(!isKeyboardOpen)
  }, [isKeyboardOpen])

  if (!shouldShow || !visible || !role) return null

  const tabs = role === 'parent' ? parentTabs : familyTabs

  function isActive(tab: Tab): boolean {
    if (!pathname) return false
    // Exact match for home tabs to avoid matching sub-pages
    if (tab.href === '/dashboard' && role === 'family') {
      return pathname === '/dashboard'
    }
    if (tab.href === '/dashboard/parent' && role === 'parent') {
      return pathname === '/dashboard/parent'
    }
    return tab.matchPaths.some((p) => pathname.startsWith(p))
  }

  return (
    <nav className="bottom-tab-bar">
      <div className="bottom-tab-bar-inner">
        {tabs.map((tab) => {
          const active = isActive(tab)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`bottom-tab ${active ? 'bottom-tab-active' : 'bottom-tab-inactive'}`}
            >
              <Image
                src={tab.iconSrc}
                alt={tab.label}
                width={28}
                height={28}
                className={`bottom-tab-img ${active ? 'bottom-tab-img-active' : 'bottom-tab-img-inactive'}`}
              />
              <span className={`bottom-tab-label ${active ? 'bottom-tab-label-active' : 'bottom-tab-label-inactive'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
