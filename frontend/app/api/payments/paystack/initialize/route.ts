import { sameOrigin } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase/server'
import { initializePaystack, paystackConfig } from '@/lib/paystack'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try { return Response.json({ enabled: true, testMode: paystackConfig().mode === 'test' }, { headers: { 'Cache-Control': 'no-store' } }) }
  catch { return Response.json({ enabled: false }, { headers: { 'Cache-Control': 'no-store' } }) }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid origin.' }, { status: 403 })
  try {
    const db = await createClient(), { data: { user } } = await db.auth.getUser()
    if (!user) return Response.json({ error: 'Sign in to pay for your order.' }, { status: 401 })
    const { orderId } = await request.json()
    if (typeof orderId !== 'string' || !/^[a-f0-9-]{36}$/i.test(orderId)) return Response.json({ error: 'Invalid order.' }, { status: 400 })
    const { data: order, error } = await db.from('orders').select('id').eq('id', orderId).eq('customer_id', user.id).maybeSingle()
    if (error || !order) return Response.json({ error: 'Order not found.' }, { status: 404 })
    return Response.json(await initializePaystack(orderId, user.id))
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Unable to start payment. Please retry.' }, { status: 503 }) }
}
