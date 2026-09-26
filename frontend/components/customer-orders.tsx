'use client'
import Link from 'next/link'
import { OrderPayment } from './order-payment'
import { useCallback, useEffect, useState } from 'react'
import { useCustomer } from './customer-provider'
import { useCurrency } from './currency-provider'
import { CustomerSignIn } from './customer-sign-in'
import { deliveryStatus, safeTrackingUrl, statusLabels, type CustomerOrder } from '@/lib/customer-types'
export function useCustomerOrders(id?: string) {
  const { customer, loaded } = useCustomer()
  const [state, setState] = useState<{ owner: string; orders: CustomerOrder[]; error: string; ready: boolean }>({ owner: '', orders: [], error: '', ready: false })
  const refresh = useCallback(async () => {
    if (!customer) return
    try { const r = await fetch(`/api/customer/orders${id ? `?id=${encodeURIComponent(id)}` : ''}`, { cache: 'no-store' }); const data = await r.json(); if (!r.ok) throw Error(data.error); setState({ owner: customer.id, orders: data.orders, error: '', ready: true }) }
    catch (e) { setState(s => ({ ...s, orders: s.owner === customer.id ? s.orders : [], owner: customer.id, error: (e as Error).message, ready: true })) }
  }, [customer, id])
  useEffect(() => { void refresh(); const timer = setInterval(refresh, 15000); window.addEventListener('focus', refresh); return () => { clearInterval(timer); window.removeEventListener('focus', refresh) } }, [refresh])
  const own = state.owner === customer?.id
  return { orders: own ? state.orders : [], ready: loaded && (!customer || (own && state.ready)), error: own ? state.error : '', refresh }
}
export function OrderList({ limit }: { limit?: number }) {
  const { customer, loaded } = useCustomer(); const { orders, ready, error, refresh } = useCustomerOrders(); const { money } = useCurrency()
  if (!loaded || !ready) return <p role="status">Loading your orders…</p>
  if (!customer) return <CustomerSignIn />
  if (error) return <p role="alert">{error} <button onClick={refresh} className="underline">Retry</button></p>
  if (!orders.length) return <div className="rounded-lg border border-dashed border-zinc-400 p-8"><h3 className="font-heading text-2xl">No orders yet</h3><p className="my-3">Your purchases and delivery updates will appear here after checkout.</p><Link href="/shop" className="underline">Continue shopping</Link></div>
  return <div className="space-y-4">{orders.slice(0, limit).map(order => <Link href={`/order/${order.id}`} key={order.id} className="block rounded-lg border border-zinc-300 bg-white p-5 text-zinc-900 hover:border-[#b18d29]"><div className="flex flex-wrap justify-between gap-3"><b className="break-all text-sm">{order.order_number}</b><span className="rounded bg-[#fff4ce] px-3 py-1 text-sm">{statusLabels[deliveryStatus(order)] || order.status}</span></div><p className="my-3">{order.order_items.map(i => `${i.product_name} × ${i.quantity}`).join(', ')}</p><div className="flex justify-between gap-3 text-sm"><span>{order.created_at.slice(0, 10)}</span><strong>{money(Number(order.total), order.currency)}</strong></div><span className="mt-4 inline-block text-sm underline">View order & track delivery →</span></Link>)}</div>
}
export function OrderDetails({ id }: { id: string }) {
  const { customer, loaded } = useCustomer(); const { orders, ready, error, refresh } = useCustomerOrders(id); const { money } = useCurrency()
  if (!loaded || !ready) return <p>Loading order…</p>
  if (!customer) return <CustomerSignIn />
  if (error) return <p role="alert">{error} <button onClick={refresh}>Retry</button></p>
  const order = orders.find(o => o.id === id)
  if (!order) return <div><h1 className="font-heading text-3xl">Order not found</h1><p className="my-4">This order is not available for your account.</p><Link href="/dashboard/orders" className="underline">Your orders</Link></div>
  const status = deliveryStatus(order), stages = ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered'], current = stages.indexOf(status === 'paid' ? 'pending' : status)
  const events = [...order.order_events].sort((a, b) => a.created_at.localeCompare(b.created_at))
  return <div className="space-y-8"><Link href="/dashboard/orders" className="underline">← Your orders</Link><header><p className="text-sm">Placed {order.created_at.slice(0, 10)}</p><h1 className="my-3 break-all font-heading text-3xl">{order.order_number}</h1><p className="text-xl text-[#e4c158]">{statusLabels[status] || status}</p></header><OrderPayment order={order} refresh={refresh} /><section className="store-panel"><h2 className="mb-6 font-heading text-2xl">Delivery progress</h2>{current >= 0 && <ol className="grid gap-4 sm:grid-cols-5">{stages.map((stage, i) => <li key={stage} aria-current={stage === status ? 'step' : undefined} className={`border-t-4 pt-3 ${i <= current ? 'border-[#e4c158]' : 'border-zinc-600 text-zinc-400'}`}><span className="block text-sm">{i < current ? '✓' : i + 1}</span>{statusLabels[stage]}</li>)}</ol>}<p className="mt-6 text-sm text-zinc-400">Updates are supplied by our team and refresh automatically. Carrier tracking appears when dispatch details are available.</p>{order.shipments.map(shipment => { const url = safeTrackingUrl(shipment.tracking_url); return <div key={shipment.id} className="mt-6 border-t border-zinc-600 pt-4"><p>Carrier: {shipment.carrier || 'Not assigned yet'}</p><p>Tracking number: {shipment.tracking_number || 'Awaiting dispatch'}</p>{shipment.current_location && <p>Latest location: {shipment.current_location}</p>}{shipment.estimated_delivery && <p>Estimated delivery: {shipment.estimated_delivery}</p>}{url && <a href={url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block underline">Track with carrier ↗</a>}</div> })}</section><section className="store-panel"><h2 className="mb-5 font-heading text-2xl">Items in your order</h2>{order.order_items.map(item => <div key={item.id} className="flex justify-between gap-4 border-b border-zinc-700 py-4"><div>{item.product_name}<p className="text-sm text-zinc-400">Size {item.size} · Quantity {item.quantity}</p></div><b>{money(Number(item.unit_price) * item.quantity, order.currency)}</b></div>)}<p className="mt-5 flex justify-between"><span>Items subtotal</span><b>{money(Number(order.subtotal), order.currency)}</b></p><p className="mt-3 text-sm text-zinc-400">Delivery charges are arranged separately with our team. Your verified payment details are shown above.</p></section><div className="grid gap-6 md:grid-cols-2"><section className="store-panel"><h2 className="mb-4 font-heading text-2xl">Delivery address</h2>{['name', 'address', 'city', 'state', 'postal', 'country', 'phone'].map(key => <p key={key}>{order.shipping_address[key]}</p>)}<Link href="/contact" className="mt-5 inline-block underline">Need to change your delivery details?</Link></section><section className="store-panel"><h2 className="mb-4 font-heading text-2xl">Order updates</h2><ol className="space-y-5">{events.map(event => <li key={event.id}><strong>{statusLabels[event.status] || event.status}</strong><time className="block text-xs text-zinc-400">{event.created_at.slice(0, 16).replace('T', ' ')} UTC</time>{event.customer_note && <p className="mt-1 text-sm">{event.customer_note}</p>}</li>)}</ol></section></div><div className="flex gap-6"><button onClick={() => window.print()} className="underline">Print order details</button><Link href="/contact" className="underline">Contact support</Link><Link href="/shop" className="underline">Visit shop</Link></div></div>
}
