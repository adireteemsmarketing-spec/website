import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { customerReturnPath } from '@/lib/supabase/oauth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const configured = new URL(process.env.NEXT_PUBLIC_APP_URL || url.origin)
  // Preserve the callback's cookie host (including www) on public requests.
  // Use the configured public URL when a proxy exposes an internal address.
  const origin = ['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname) && configured.hostname !== url.hostname
    ? configured.origin : url.origin
  const code = url.searchParams.get('code')
  if (code && !url.searchParams.has('error')) {
    try {
      const db = await createClient()
      const { error } = await db.auth.exchangeCodeForSession(code)
      if (!error) {
        const response = NextResponse.redirect(new URL(customerReturnPath(url.searchParams.get('next')), origin))
        response.headers.set('Cache-Control', 'no-store')
        return response
      }
    } catch { /* Expired codes and network failures can be retried from sign-in. */ }
  }
  const response = NextResponse.redirect(new URL('/auth/error', origin))
  response.headers.set('Cache-Control', 'no-store')
  return response
}
