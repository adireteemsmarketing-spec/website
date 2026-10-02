import { adminSession, sameOrigin } from '@/lib/admin-auth'
import { safeTrackingUrl } from '@/lib/customer-types'
import { orderItemMedia, type OrderMediaItem } from '@/lib/order-media'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const session = await adminSession()
    if (!session) return Response.json({ error: 'Admin access required.' }, { status: 403 })
    const { data, error } = await session.db.from('orders').select('*,order_items(*,product_variants(products(slug,product_images(storage_path,alt_text,sort_order)))),shipments(*),order_events(*),payments(id,provider,reference,amount,currency,status,verified_at,created_at,provider_mode)').order('created_at', { ascending: false }).limit(200)
    if (error) throw error
    const orders = data?.map(order => ({ ...order, order_items: order.order_items.map((item: OrderMediaItem) => {
      const { product_variants, ...details } = item
      return { ...details, ...orderItemMedia({ ...details, product_variants }) }
    }) }))
    return Response.json({ orders }, { headers: { 'Cache-Control': 'no-store' } })
  } catch { return Response.json({ error: 'Unable to load orders.' }, { status: 503 }) }
}
export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid origin.' }, { status: 403 })
  try {
    const session = await adminSession()
    if (!session) return Response.json({ error: 'Admin access required.' }, { status: 403 })
    const { id, status, details } = await request.json()
    if (!details || typeof details !== 'object' || Object.values(details).some(v => typeof v !== 'string' || v.length > 1000) || (details.trackingUrl && !safeTrackingUrl(details.trackingUrl))) return Response.json({ error: 'Check the delivery details. Tracking links must use HTTPS.' }, { status: 400 })
    const { error } = await session.db.rpc('update_customer_delivery', { target: id, next_status: status, details })
    if (error) return Response.json({ error: error.code === 'P0001' ? error.message : 'Unable to update delivery. Check that the customer journey migration is installed.' }, { status: 400 })
    return Response.json({ ok: true })
  } catch { return Response.json({ error: 'Unable to update delivery.' }, { status: 503 }) }
}
