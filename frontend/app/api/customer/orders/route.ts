import { createClient } from '@/lib/supabase/server'
import { sameOrigin } from '@/lib/admin-auth'
import { paystackConfig } from '@/lib/paystack'
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  try {
    const db = await createClient(); const { data: { user } } = await db.auth.getUser()
    if (!user) return Response.json({ error: 'Sign in to view your orders.' }, { status: 401 })
    const id = new URL(request.url).searchParams.get('id')
    if (id && !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)) return Response.json({ orders: [] })
    let query = db.from('orders').select('*,order_items(*),shipments(*),order_events(*),payments(id,provider,reference,amount,currency,status,verified_at,created_at,provider_mode)').eq('customer_id', user.id).order('created_at', { ascending: false }).limit(200)
    if (id) query = query.eq('id', id)
    const { data, error } = await query
    if (error) throw error
    return Response.json({ orders: data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch { return Response.json({ error: 'Unable to load orders. Please retry.' }, { status: 503 }) }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid origin.' }, { status: 403 })
  try {
    const db = await createClient(); const { data: { user } } = await db.auth.getUser()
    if (!user) return Response.json({ error: 'Sign in before placing your order.' }, { status: 401 })
    const { items, shipping, requestKey } = await request.json()
    if (!Array.isArray(items) || !items.length || items.length > 50 || typeof requestKey !== 'string' || !/^[a-f0-9-]{36}$/i.test(requestKey) || !shipping || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email || '')) return Response.json({ error: 'Check your bag and contact details.' }, { status: 400 })
    paystackConfig()
    const { data, error } = await db.rpc('place_paystack_order', { items, shipping, request_key: requestKey })
    if (error) return Response.json({ error: error.code === 'PGRST202' ? 'Payment setup needs the Supabase payment migration. Your bag is safe; please contact the shop.' : error.code === 'P0001' ? error.message : 'Unable to submit your order. Please retry.' }, { status: 400 })
    return Response.json({ id: data }, { status: 201 })
  } catch { return Response.json({ error: 'Unable to submit your order. Please retry.' }, { status: 503 }) }
}
