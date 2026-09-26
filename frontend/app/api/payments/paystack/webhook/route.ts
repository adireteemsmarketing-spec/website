import { validPaystackSignature, verifyPaystack } from '@/lib/paystack'
import { createAdminClient } from '@/lib/supabase/admin'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.text()
  if (body.length > 1000000) return new Response('Payload too large', { status: 413 })
  try {
    if (!validPaystackSignature(body, request.headers.get('x-paystack-signature'))) return new Response('Invalid signature', { status: 401 })
    const event = JSON.parse(body)
    if (event.event !== 'charge.success') return Response.json({ received: true })
    const reference = event.data?.reference
    if (typeof reference !== 'string') return new Response('Invalid event', { status: 400 })
    // Other applications may use this merchant account too.
    const { data, error } = await createAdminClient().from('payments').select('id').eq('provider', 'paystack').eq('reference', reference).maybeSingle()
    if (error) throw error
    if (data) { const result = await verifyPaystack(reference); if (!result.paid) throw Error('Verification pending') }
    return Response.json({ received: true })
  } catch { return new Response('Payment processing pending; retry delivery', { status: 503 }) }
}
