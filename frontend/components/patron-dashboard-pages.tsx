'use client'
import Link from 'next/link'
import { useState } from 'react'
import { DashboardHeader } from './dashboard-ui'
import { OrderList, useCustomerOrders } from './customer-orders'
import { useCustomer } from './customer-provider'
import { CustomerSignIn } from './customer-sign-in'
import { statusLabels } from '@/lib/customer-types'
export function OrdersPage() { return <><DashboardHeader title="Your orders" eyebrow="Purchases & delivery tracking" /><section className="mt-8"><OrderList /></section></> }
export function MessagesPage() {
  const { customer } = useCustomer(); const { orders, ready, error, refresh } = useCustomerOrders()
  const updates = orders.flatMap(order => order.order_events.map(event => ({ ...event, order }))).sort((a, b) => b.created_at.localeCompare(a.created_at))
  return <><DashboardHeader title="Order updates" />{!ready ? <p className="mt-8">Loading updates…</p> : !customer ? <CustomerSignIn /> : error ? <p role="alert">{error} <button onClick={refresh}>Retry</button></p> : <section className="mt-8 space-y-4">{updates.length ? updates.map(event => <Link href={`/order/${event.order.id}`} key={event.id} className="block rounded-lg border bg-white p-6"><p className="font-semibold">{statusLabels[event.status] || event.status}</p><p className="my-2 text-sm">{event.customer_note || 'Your order status has been updated.'}</p><p className="break-all text-xs text-zinc-500">{event.order.order_number} · {event.created_at.slice(0, 16).replace('T', ' ')} UTC</p></Link>) : <p>Updates will appear here when you place an order.</p>}<Link href="/contact" className="inline-block underline">Contact customer support</Link></section>}</>
}
export function AccountPage() {
  const { customer, loaded, refresh } = useCustomer(); const [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
  async function save(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); setBusy(true); setMessage(''); try { const data = Object.fromEntries(new FormData(e.currentTarget)); const r = await fetch('/api/customer', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); const result = await r.json(); if (!r.ok) throw Error(result.error); await refresh(); setMessage('Your details have been saved.') } catch (e) { setMessage((e as Error).message) } finally { setBusy(false) } }
  return <><DashboardHeader title="Account settings" />{!loaded ? <p>Loading account…</p> : !customer ? <CustomerSignIn /> : <form key={customer.id} onSubmit={save} className="mt-8 grid max-w-2xl gap-5 rounded-lg border bg-white p-6"><label>Full name<input name="name" required maxLength={150} defaultValue={customer.name} autoComplete="name" className="mt-2 block w-full border p-3" /></label><label>Email<input readOnly value={customer.email} className="mt-2 block w-full border bg-zinc-100 p-3" /></label><label>Phone<input name="phone" type="tel" maxLength={40} defaultValue={customer.phone} autoComplete="tel" className="mt-2 block w-full border p-3" /></label><button disabled={busy} className="bg-black px-5 py-3 text-white">{busy ? 'Saving…' : 'Save details'}</button><p role="status">{message}</p></form>}</>
}
export function AddressesPage() {
  const { customer } = useCustomer(); const { orders, ready, error } = useCustomerOrders()
  return <><DashboardHeader title="Delivery addresses" />{!ready ? <p>Loading…</p> : !customer ? <CustomerSignIn /> : error ? <p role="alert">{error}</p> : <section className="mt-8 grid gap-5 md:grid-cols-2">{orders.length ? orders.map(order => <article key={order.id} className="rounded-lg border bg-white p-6"><p className="mb-3 break-all text-xs">{order.order_number}</p>{['name', 'address', 'city', 'state', 'postal', 'country'].map(k => <p key={k}>{order.shipping_address[k]}</p>)}<Link href={`/order/${order.id}`} className="mt-4 inline-block underline">View delivery</Link></article>) : <p>You can enter your delivery address at checkout.</p>}</section>}</>
}
export function ReviewsPage() { return <><DashboardHeader title="Product feedback" /><p className="mt-8">Need help with a piece you received?</p><Link href="/contact" className="mt-4 inline-block underline">Share feedback with customer support</Link></> }
export function HistoryPage() { return <><DashboardHeader title="Continue shopping" /><p className="mt-8">Find your selected pieces in your shopping bag.</p><Link href="/dashboard/cart" className="mt-4 inline-block underline">Open your bag</Link></> }
