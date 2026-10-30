import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { customerReturnPath, publicAuthOrigin } from '@/lib/supabase/oauth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = publicAuthOrigin(request.url)
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
