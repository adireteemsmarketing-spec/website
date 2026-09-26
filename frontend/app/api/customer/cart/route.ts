import { createClient } from '@/lib/supabase/server'
import { sameOrigin } from '@/lib/admin-auth'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const db = await createClient(); const { data: { user } } = await db.auth.getUser()
    if (!user) return Response.json({ error: 'Sign in first.' }, { status: 401 })
    const { data: cart, error } = await db.from('carts').select('id').eq('customer_id', user.id).maybeSingle()
    if (error) throw error
    if (!cart) return Response.json({ items: [] })
    const result = await db.from('cart_items').select('quantity,product_variants!inner(product_id,size)').eq('cart_id', cart.id)
    if (result.error) throw result.error
    const items = result.data.map(row => { const variant = Array.isArray(row.product_variants) ? row.product_variants[0] : row.product_variants; return { productId: variant.product_id, size: variant.size, quantity: row.quantity } })
    return Response.json({ items }, { headers: { 'Cache-Control': 'no-store' } })
  } catch { return Response.json({ error: 'Unable to load your saved bag.' }, { status: 503 }) }
}
export async function PUT(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid origin.' }, { status: 403 })
  try {
    const db = await createClient(); const { data: { user } } = await db.auth.getUser()
    if (!user) return Response.json({ error: 'Sign in first.' }, { status: 401 })
    const { items, owner } = await request.json()
    if (owner !== user.id) return Response.json({ error: 'Your account changed. Reload your bag.' }, { status: 409 })
    if (!Array.isArray(items) || items.length > 50) return Response.json({ error: 'Invalid bag.' }, { status: 400 })
    const { error } = await db.rpc('save_customer_cart', { items })
    if (error) return Response.json({ error: error.code === 'PGRST202' ? 'Account bag saving is not enabled yet. Your bag is saved on this device.' : 'Unable to sync your bag. Please retry.' }, { status: 503 })
    return Response.json({ ok: true })
  } catch { return Response.json({ error: 'Unable to save your bag.' }, { status: 503 }) }
}
