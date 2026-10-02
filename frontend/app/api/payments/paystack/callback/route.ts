import { paystackConfig, verifyPaystack } from '@/lib/paystack'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const origin = paystackConfig().origin
  const reference = new URL(request.url).searchParams.get('reference') || ''
  try {
    const result = await verifyPaystack(reference)
    return Response.redirect(result.paid ? `${origin}/thank-you/${result.orderId}` : `${origin}/order/${result.orderId}?payment=pending`, 303)
  } catch {
    // An unverified callback never changes payment status.
    return Response.redirect(`${origin}/dashboard/orders?payment=unconfirmed`, 303)
  }
}
