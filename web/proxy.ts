import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware is now a simple pass-through.
// Auth protection is handled client-side in each page.
export async function proxy(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
