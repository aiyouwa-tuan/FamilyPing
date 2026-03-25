import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const redirectTo = searchParams.get('redirect_to') ?? next

  // Use the deployed URL, not request origin (which may differ)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://web-six-gold-l0wwtqu6sp.vercel.app'

  if (code) {
    const response = NextResponse.redirect(`${siteUrl}${redirectTo}`)

    const supabase = createServerClient(
      'https://uokqhrbiwqcyuszltsxk.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVva3FocmJpd3FjeXVzemx0c3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNDYyMTEsImV4cCI6MjA4OTkyMjIxMX0.NYYVZC2RKAVJvdAx44Y9AfS3TVqB15h3rn0a2YReHQ4',
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, {
                ...options,
                // Ensure cookies work across the site
                path: '/',
                sameSite: 'lax',
                secure: true,
              })
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return response
    }
    console.error('Auth callback error:', error.message)
  }

  return NextResponse.redirect(`${siteUrl}/auth/login?error=auth_callback_error`)
}
