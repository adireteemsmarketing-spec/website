import { adminSession, sameOrigin } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
export const dynamic = 'force-dynamic'
export async function GET() {
  try { const session = await adminSession(); return Response.json({ authenticated: Boolean(session), role: session?.role }, { headers: { 'Cache-Control': 'no-store' } }) }
  catch { return Response.json({ error: 'Sign-in service is unavailable.' }, { status: 503 }) }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid origin' }, { status: 403 })
  try {
    const { email, password } = await request.json()
    if (typeof email !== 'string' || typeof password !== 'string' || email.length > 254 || password.length > 1024) return Response.json({ error: 'Enter your email and password.' }, { status: 400 })
    // Check credentials and staff membership before changing any browser cookies.
    const login = createPublicClient()
    const { data, error } = await login.auth.signInWithPassword({ email: email.trim(), password })
    if (error) return Response.json({ error: 'Unable to sign in. Check your email and password.' }, { status: error.status === 429 ? 429 : 401 })
    const { data: profile, error: profileError } = await login.from('profiles').select('role').eq('user_id', data.user.id).single()
    if (profileError || !['admin', 'super_admin'].includes(profile?.role)) {
      await login.auth.signOut({ scope: 'local' })
      return Response.json({ error: 'This account does not have admin access.' }, { status: 403 })
    }
    const db = await createClient('admin')
    const { error: sessionError } = await db.auth.setSession(data.session)
    if (sessionError) { await login.auth.signOut({ scope: 'local' }); throw sessionError }
    return Response.json({ authenticated: true, role: profile.role })
  } catch { return Response.json({ error: 'Sign-in service is unavailable.' }, { status: 503 }) }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid origin' }, { status: 403 })
  try { const db = await createClient('admin'); const { error } = await db.auth.signOut({ scope: 'local' }); if (error) throw error; return Response.json({ ok: true }) }
  catch { return Response.json({ error: 'Unable to sign out.' }, { status: 503 }) }
}

