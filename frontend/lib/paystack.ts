import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export function paystackConfig() {
  const secret = process.env.PAYSTACK_SECRET_KEY || ''
  if (!/^sk_(test|live)_[a-zA-Z0-9]+$/.test(secret)) throw Error('Paystack is not configured. Please contact the shop.')
  const origin = new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').origin
  return { secret, origin, mode: secret.startsWith('sk_test_') ? 'test' : 'live' }
}

type Transaction = { reference: string; status: string; amount: number; currency: string; domain: string }
type Attempt = { id: string; order_id: string; reference: string; amount: number; currency: string; email: string; checkout_url: string | null }

async function paystackRequest<T>(path: string, body?: object): Promise<T> {
  const { secret } = paystackConfig()
  const response = await fetch(`https://api.paystack.co${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store', signal: AbortSignal.timeout(20000),
  })
  const result = await response.json()
  // Do not pass provider response bodies or credentials into client errors/logs.
  if (!response.ok || result.status !== true) throw Error('Paystack could not complete this request. Please retry from your order.')
  return result.data as T
}

export function validPaystackSignature(body: string, signature: string | null) {
  if (!signature || !/^[a-f0-9]{128}$/i.test(signature)) return false
  const expected = createHmac('sha512', paystackConfig().secret).update(body).digest()
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'))
}

export async function verifyPaystack(reference: string) {
  if (!/^ADR-[a-f0-9]{32}$/.test(reference)) throw Error('Invalid payment reference.')
  const db = createAdminClient()
  const { data: attempt, error } = await db.from('payments').select('order_id,reference,amount,currency,provider_mode,status').eq('provider', 'paystack').eq('reference', reference).maybeSingle()
  if (error || !attempt) throw Error('Payment could not be found.')
  if (attempt.status === 'successful') return { orderId: attempt.order_id as string, paid: true }
  const transaction = await paystackRequest<Transaction>(`/transaction/verify/${encodeURIComponent(reference)}`)
  if (transaction.reference !== reference || transaction.domain !== attempt.provider_mode || transaction.currency !== attempt.currency || !Number.isSafeInteger(transaction.amount) || transaction.amount !== Math.round(Number(attempt.amount) * 100)) throw Error('Payment details could not be verified. Please contact support.')
  if (transaction.status !== 'success') {
    if (['failed', 'abandoned', 'reversed'].includes(transaction.status)) {
      const { error: saveError } = await db.from('payments').update({ status: 'failed' }).eq('reference', reference).eq('provider', 'paystack').eq('status', 'pending')
      if (saveError) throw Error('Unable to update payment status. Please retry.')
    }
    return { orderId: attempt.order_id as string, paid: false }
  }
  const { data: orderId, error: saveError } = await db.rpc('settle_paystack_payment', {
    payment_ref: reference, paid_amount: transaction.amount, paid_currency: transaction.currency, mode: transaction.domain,
  })
  if (saveError) throw Error('Payment confirmation is pending. Please refresh your order shortly; do not pay again.')
  return { orderId: orderId as string, paid: true }
}

export async function initializePaystack(orderId: string, buyer: string) {
  const config = paystackConfig(), db = createAdminClient()
  // Reconcile a previous attempt before offering another checkout.
  const { data: previous, error: previousError } = await db.from('payments').select('reference,provider_mode,checkout_url').eq('order_id', orderId).eq('provider', 'paystack').eq('status', 'pending').order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (previousError) throw Error('Unable to check existing payments. Please retry.')
  if (previous && previous.provider_mode === config.mode) {
    try {
      const verified = await verifyPaystack(previous.reference)
      if (verified.paid) return { orderId, paid: true, testMode: config.mode === 'test' }
    } catch {
      if (previous.checkout_url) throw Error('Unable to confirm your earlier payment attempt. Please check payment status before paying again.')
      // The provider may not yet know an attempt interrupted before initialization.
      // prepare_paystack_payment serializes attempts and reuses an existing checkout URL.
    }
  }
  const { data, error } = await db.rpc('prepare_paystack_payment', { target: orderId, buyer, mode: config.mode })
  if (error) throw Error(error.code === 'PGRST202' ? 'Payment setup needs the Supabase payment migration. Your order is saved.' : error.code === 'P0001' ? error.message : 'Unable to prepare payment. Please retry.')
  const attempt = data as Attempt
  if (attempt.checkout_url) return { orderId, authorizationUrl: attempt.checkout_url, testMode: config.mode === 'test' }
  const amount = Math.round(Number(attempt.amount) * 100)
  if (!Number.isSafeInteger(amount) || amount <= 0) throw Error('Invalid order amount. Please contact support.')
  const result = await paystackRequest<{ authorization_url: string; reference: string }>('/transaction/initialize', {
    email: attempt.email, amount, currency: attempt.currency, reference: attempt.reference,
    callback_url: `${config.origin}/api/payments/paystack/callback`,
    metadata: { order_id: orderId, cancel_action: `${config.origin}/order/${orderId}?payment=cancelled` },
  })
  const url = new URL(result.authorization_url)
  if (result.reference !== attempt.reference || url.protocol !== 'https:' || url.hostname !== 'checkout.paystack.com') throw Error('Paystack returned an unexpected checkout. Please contact support.')
  const { error: saveError } = await db.from('payments').update({ checkout_url: url.href }).eq('id', attempt.id)
  if (saveError) throw Error('Unable to save payment checkout. Please retry from your order in a minute.')
  return { orderId, authorizationUrl: url.href, testMode: config.mode === 'test' }
}
