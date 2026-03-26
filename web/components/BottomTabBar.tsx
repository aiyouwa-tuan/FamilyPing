'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Tab {
  href: string
  label: string
  icon: string
  activeIcon: string
  matchPaths: string[]
}

const tabs: Tab[] = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: '\uD83C\uDFE0',
    activeIcon: '\uD83C\uDFE0',
    matchPaths: ['/dashboard'],
  },
  {
    href: '/dashboard/health',
    label: 'Health',
    icon: '\u2764\uFE0F',
    activeIcon: '\u2764\uFE0F',
    matchPaths: ['/dashboard/health'],
  },
  {
    href: '/dashboard/parent/listen',
    label: 'Listen',
    icon: '\uD83C\uDFA7',
    activeIcon: '\uD83C\uDFA7',
    matchPaths: ['/dashboard/parent/listen'],
  },
  {
    href: '/dashboard/messages',
    label: 'Messages',
    icon: '\uD83D\uDCAC',
    activeIcon: '\uD83D\uDCAC',
    matchPaths: ['/dashboard/messages'],
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: '\u2699\uFE0F',
    activeIcon: '\u2699\uFE0F',
    matchPaths: ['/dashboard/settings'],
  },
]

export default function BottomTabBar() {
  const pathname = usePathname()
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [visible, setVisible] = useState(true)

  // Only show on /dashboard/* pages
  const shouldShow = pathname?.startsWith('/dashboard')

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

  if (!shouldShow || !visible) return null

  function isActive(tab: Tab): boolean {
    if (!pathname) return false
    // Exact match for /dashboard to avoid matching sub-pages
    if (tab.href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/dashboard/parent'
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
              <span className={`bottom-tab-icon ${active ? 'bottom-tab-icon-active' : ''}`}>
                {active ? tab.activeIcon : tab.icon}
              </span>
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
