import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import NavbarWrapper from '@/components/NavbarWrapper'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'FamilyPing - Know your parents are OK',
  description: 'A daily check-in app for families to stay connected with aging parents.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#FFF8F0]">
        <NavbarWrapper />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
