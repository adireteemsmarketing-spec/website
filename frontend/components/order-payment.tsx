'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CustomerOrder } from '@/lib/customer-types'

export function OrderPayment({ order, refresh }: { order: CustomerOrder; refresh: () => Promise<void> }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('')
  const payments = [...(order.payments || [])].sort((a, b) => b.created_at.localeCompare(a.created_at))
  const successful = payments.filter(p => p.status === 'successful'), latest = payments[0]
  async function act(action: 'initialize' | 'verify') {
    setBusy(true); setMessage('')
    try {
      const response = await fetch(`/api/payments/paystack/${action}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'initialize' ? { orderId: order.id } : { reference: latest?.reference }),
      })
      const result = await response.json()
      if (!response.ok) throw Error(result.error)
      if (result.authorizationUrl) { window.location.assign(result.authorizationUrl); return }
      if (result.paid) { router.push(`/thank-you/${order.id}`); return }
      setMessage(result.paid ? 'Payment confirmed by Paystack.' : 'Payment has not been confirmed. If you completed payment, wait briefly and check again before paying again.')
      await refresh()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to check payment. Please retry.') }
    finally { setBusy(false) }
  }
  return <section className="store-panel" aria-label="Payment details">
    <h2 className="mb-4 font-heading text-2xl">Payment</h2>
    <p className="font-semibold">{successful.length ? 'Payment confirmed' : latest?.status === 'failed' ? 'Payment not completed' : 'Awaiting payment'}</p>
    <p className="mt-3">Order amount: {order.currency} {Number(order.total).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
    {(successful.length ? successful : latest ? [latest] : []).map(payment => <div key={payment.id} className="mt-4 text-sm">
      {payment.provider_mode === 'test' && <p className="mb-2 text-amber-300">Test payment — no real money charged.</p>}
      <p>Provider: Paystack</p><p className="break-all">Reference: {payment.reference}</p>
      {payment.status === 'successful' && <p>Verified amount: {payment.currency} {Number(payment.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>}
      {payment.verified_at && <p>Confirmed: {payment.verified_at.slice(0, 16).replace('T', ' ')} UTC</p>}
    </div>)}
    {successful.length > 1 && <p className="mt-4 text-amber-300">More than one payment was received. Please contact support for a refund review.</p>}
    {successful.length > 0 && order.status === 'cancelled' && <p className="mt-4 text-amber-300">This order is cancelled. Please contact support about the payment.</p>}
    {!successful.length && <div className="mt-5 flex flex-wrap gap-4">
      {order.status === 'pending' && <button disabled={busy} onClick={() => void act('initialize')} className="store-primary disabled:opacity-50">{busy ? 'Please wait…' : 'Pay with Paystack'}</button>}
      {latest && <button disabled={busy} onClick={() => void act('verify')} className="underline disabled:opacity-50">Check payment status</button>}
    </div>}
    {!successful.length && <p className="mt-4 text-sm text-zinc-400">If you closed checkout or payment was interrupted, check the payment status before trying again. This page refreshes automatically when confirmation arrives.</p>}
    {message && <p role="status" className="mt-4 text-amber-200">{message}</p>}
  </section>
}
