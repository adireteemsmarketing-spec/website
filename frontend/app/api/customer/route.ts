import { createClient } from '@/lib/supabase/server'
import { sameOrigin } from '@/lib/admin-auth'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const db = await createClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return Response.json({ customer: null }, { headers: { 'Cache-Control': 'no-store' } })
    const { data, error } = await db.from('profiles').select('full_name,phone').eq('user_id', user.id).single()
    if (error) throw error
    return Response.json({ customer: { id: user.id, email: user.email || '', name: data.full_name, phone: data.phone || '' } }, { headers: { 'Cache-Control': 'no-store' } })
  } catch { return Response.json({ error: 'Unable to load your account. Please retry.' }, { status: 503 }) }
}
export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid origin.' }, { status: 403 })
  try {
    const db = await createClient(); const { data: { user } } = await db.auth.getUser()
    if (!user) return Response.json({ error: 'Sign in first.' }, { status: 401 })
    const { name, phone } = await request.json()
    if (typeof name !== 'string' || !name.trim() || name.length > 150 || typeof phone !== 'string' || phone.length > 40) return Response.json({ error: 'Enter a valid name and phone number.' }, { status: 400 })
    const { error } = await db.from('profiles').update({ full_name: name.trim(), phone: phone.trim() }).eq('user_id', user.id)
    if (error) throw error
    return Response.json({ ok: true })
  } catch { return Response.json({ error: 'Unable to save your details.' }, { status: 503 }) }
}
