import { readJsonBody, requestBodyError } from '@/lib/request-body'
import { adminSession, sameOrigin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { emptyPromotion, validatePromotion } from '@/lib/promotion'
import { mediaUrl, storagePath } from '@/lib/storage'

export const dynamic = 'force-dynamic'
export async function GET() {
  if (!await adminSession()) return Response.json({ error: 'Admin access required.' }, { status: 403 })
  try {
    const { data, error } = await createAdminClient().from('site_content').select('value,published').eq('key', 'homepage_promotion').maybeSingle()
    if (error) throw error
    const promotion = data ? validatePromotion({ ...data.value, image: mediaUrl(data.value.image || ''), published: data.published }) : emptyPromotion
    return Response.json(promotion, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { const rejected = requestBodyError(error); if (rejected) return rejected; return Response.json({ error: 'Unable to load homepage promotion.' }, { status: 503 }) }
}
export async function POST(request: Request) {
  if (!sameOrigin(request) || !await adminSession()) return Response.json({ error: 'Admin access required.' }, { status: 403 })
  try {
    const promotion = validatePromotion(await readJsonBody(request,12000))
    const { published, ...value } = promotion
    // Managers may edit only this non-secret content row, not owner settings.
    const { error } = await createAdminClient().from('site_content').upsert({ key: 'homepage_promotion', published, value: { ...value, image: value.image ? storagePath(value.image) : '' } })
    if (error) throw Error('Unable to save homepage promotion.')
    return Response.json(promotion)
  } catch (error) { const rejected = requestBodyError(error); if (rejected) return rejected; return Response.json({ error: error instanceof Error ? error.message : 'Unable to save promotion.' }, { status: 400 }) }
}
