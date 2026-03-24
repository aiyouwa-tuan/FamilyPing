import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Auth is handled client-side via localStorage in the dashboard layout.
  // This middleware is a placeholder for future server-side auth (e.g., cookie-based).
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
