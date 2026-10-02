import { readStore } from '@/lib/store-db'
import { createPublicClient } from '@/lib/supabase/public'
import { mediaUrl } from '@/lib/storage'
import { validatePromotion } from '@/lib/promotion'
export const dynamic='force-dynamic'
export async function GET() {
  try {
    const [store, promo] = await Promise.all([readStore(), createPublicClient().from('site_content').select('value,published').eq('key', 'homepage_promotion').eq('published', true).maybeSingle()])
    let promotion = null
    if (promo.data) {
      try { promotion = validatePromotion({ ...promo.data.value, image: mediaUrl(promo.data.value.image || ''), published: true }) } catch { /* Invalid content should not break the catalogue. */ }
    }
    return Response.json({ products: store.products.filter(p => p.status === 'published'), posts: store.posts.filter(p => p.status === 'published'), promotion }, { headers: { 'Cache-Control': 'no-store' } })
  } catch { return Response.json({ error: 'Store data is unavailable.' }, { status: 503 }) }
}
