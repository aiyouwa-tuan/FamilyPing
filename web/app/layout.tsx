import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomTabBar from '@/components/BottomTabBar'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'FamilyPing',
  description: 'A daily check-in app for families to stay connected with aging parents.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    apple: '/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FamilyPing',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <meta name="theme-color" content="#FF6B35" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full flex flex-col font-system" style={{ background: 'linear-gradient(180deg, #FFF5EE 0%, #FFE8D6 100%)' }}>
        <div className="safe-area-top" />
        <main className="flex-1 pb-[80px]">{children}</main>
        <BottomTabBar />
      </body>
    </html>
  )
}
