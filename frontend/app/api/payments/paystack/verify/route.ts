import { sameOrigin } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase/server'
import { verifyPaystack } from '@/lib/paystack'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid origin.' }, { status: 403 })
  try {
    const db = await createClient(), { data: { user } } = await db.auth.getUser()
    if (!user) return Response.json({ error: 'Sign in to check payment.' }, { status: 401 })
    const { reference } = await request.json()
    if (typeof reference !== 'string' || !/^ADR-[a-f0-9]{32}$/.test(reference)) return Response.json({ error: 'Invalid reference.' }, { status: 400 })
    const { data: payment, error } = await db.from('payments').select('order_id').eq('provider', 'paystack').eq('reference', reference).maybeSingle()
    if (error || !payment) return Response.json({ error: 'Payment not found.' }, { status: 404 })
    const { data: order } = await db.from('orders').select('id').eq('id', payment.order_id).eq('customer_id', user.id).maybeSingle()
    if (!order) return Response.json({ error: 'Payment not found.' }, { status: 404 })
    return Response.json(await verifyPaystack(reference))
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Unable to check payment.' }, { status: 503 }) }
}
