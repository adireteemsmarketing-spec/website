import { adminSession, sameOrigin } from '@/lib/admin-auth'
import { readJsonBody, requestBodyError } from '@/lib/request-body'

export const dynamic = 'force-dynamic'
export async function GET() {
  const session = await adminSession()
  if (!session) return Response.json({ error: 'Sign in to view reviews.' }, { status: 401 })
  const { data, error } = await session.db.from('reviews').select('id,product_id,rating,title,body,display_name,status,created_at,products(name)').order('created_at', { ascending: false }).limit(200)
  if (error) return Response.json({ error: 'Unable to load reviews. Please retry.' }, { status: 503 })
  return Response.json({ reviews: data }, { headers: { 'Cache-Control': 'no-store' } })
}
export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid origin.' }, { status: 403 })
  const session = await adminSession()
  if (!session) return Response.json({ error: 'Sign in to manage reviews.' }, { status: 401 })
  try {
    const { id, status } = await readJsonBody(request, 2000)
    if (typeof id !== 'string' || !/^[a-f0-9-]{36}$/i.test(id) || !['pending', 'approved', 'rejected'].includes(status)) return Response.json({ error: 'Choose a valid review and status.' }, { status: 400 })
    const { data, error } = await session.db.from('reviews').update({ status }).eq('id', id).select('id').maybeSingle()
    if (error) return Response.json({ error: 'Unable to update review.' }, { status: 503 })
    if (!data) return Response.json({ error: 'Review not found.' }, { status: 404 })
    return Response.json({ ok: true })
  } catch (error) {
    return requestBodyError(error) || Response.json({ error: 'Unable to update review.' }, { status: 400 })
  }
}
