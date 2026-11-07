import { createClient } from '@/lib/supabase/server'
import { sameOrigin } from '@/lib/admin-auth'
import { readJsonBody, requestBodyError } from '@/lib/request-body'

export const dynamic = 'force-dynamic'
export async function GET() {
  const db = await createClient(), { data: { user } } = await db.auth.getUser()
  if (!user) return Response.json({ error: 'Sign in to view your reviews.' }, { status: 401 })
  const [products, reviews] = await Promise.all([
    db.from('products').select('id,name').eq('status', 'published').order('name').limit(500),
    db.from('reviews').select('id,rating,title,body,status').eq('customer_id', user.id).order('created_at', { ascending: false }),
  ])
  if (products.error || reviews.error) return Response.json({ error: 'Unable to load review details.' }, { status: 503 })
  return Response.json({ products: products.data, reviews: reviews.data }, { headers: { 'Cache-Control': 'no-store' } })
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid origin.' }, { status: 403 })
  const db = await createClient(), { data: { user } } = await db.auth.getUser()
  if (!user) return Response.json({ error: 'Sign in to submit a review.' }, { status: 401 })
  try {
    const { productId, rating, title, body, displayName } = await readJsonBody(request, 12000)
    if (typeof productId !== 'string' || !/^[a-f0-9-]{36}$/i.test(productId) || !Number.isInteger(rating) || rating < 1 || rating > 5 || typeof title !== 'string' || title.length > 150 || typeof body !== 'string' || !body.trim() || body.length > 3000 || typeof displayName !== 'string' || !displayName.trim() || displayName.length > 100) return Response.json({ error: 'Enter a product, rating, display name and review (up to 3,000 characters).' }, { status: 400 })
    const { data: product, error: productError } = await db.from('products').select('id').eq('id', productId).eq('status', 'published').maybeSingle()
    if (productError || !product) return Response.json({ error: 'This product is unavailable for reviews.' }, { status: 400 })
    const { error } = await db.from('reviews').insert({ product_id: productId, customer_id: user.id, rating, title: title.trim(), body: body.trim(), display_name: displayName.trim(), status: 'pending' })
    if (error) return Response.json({ error: error.code === '23505' ? 'You have already reviewed this product.' : 'Unable to save your review. Please retry.' }, { status: error.code === '23505' ? 409 : 503 })
    return Response.json({ ok: true }, { status: 201 })
  } catch (error) {
    return requestBodyError(error) || Response.json({ error: 'Unable to submit your review.' }, { status: 400 })
  }
}
