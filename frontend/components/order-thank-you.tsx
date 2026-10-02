'use client'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { useCustomerOrders } from './customer-orders'
import { useCustomer } from './customer-provider'
import { CustomerSignIn } from './customer-sign-in'
import { OrderPayment } from './order-payment'

export function OrderThankYou({ id }: { id: string }) {
  const { customer, loaded } = useCustomer()
  const { orders, ready, error, refresh } = useCustomerOrders(id)
  if (!loaded || !ready) return <p role="status">Checking your order…</p>
  if (!customer) return <CustomerSignIn />
  if (error) return <p role="alert">{error} <button onClick={refresh} className="underline">Retry</button></p>
  const order = orders.find(order => order.id === id)
  if (!order) return <div><h1 className="font-heading text-3xl">Order not found</h1><Link href="/dashboard/orders" className="mt-5 inline-block underline">View your orders</Link></div>
  const paid = order.payments?.some(payment => payment.status === 'successful')
  if (!paid || ['cancelled', 'refunded'].includes(order.status)) return <div className="space-y-6"><h1 className="font-heading text-3xl">Your order status</h1><OrderPayment order={order} refresh={refresh} /><Link href={`/order/${order.id}`} className="inline-block underline">View order details</Link></div>
  return <div className="mx-auto max-w-2xl text-center">
    <CheckCircle aria-hidden="true" className="mx-auto mb-6 h-16 w-16 text-[#e4c158]" />
    <h1 className="font-heading text-4xl md:text-5xl">Thank you for your purchase!</h1>
    <p className="mt-5 text-lg text-zinc-300">Your payment is confirmed. Thank you for choosing Adire Teems and celebrating African heritage with us.</p>
    <p className="mt-6 break-all text-[#e4c158]">Order {order.order_number}</p>
    {order.payments?.some(payment => payment.status === 'successful' && payment.provider_mode === 'test') && <p className="mt-4 text-amber-300">Test payment — no real money was charged.</p>}
    <div className="my-8 rounded-lg border border-zinc-700 p-6 text-left"><h2 className="font-heading text-2xl">Your items</h2>{order.order_items.map(item => <p key={item.id} className="mt-3">{item.product_name} · Size {item.size} · Qty {item.quantity}</p>)}<p className="mt-5 font-semibold">Total paid: {order.currency} {Number(order.total).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p></div>
    <p className="text-sm leading-6 text-zinc-400">Follow preparation and delivery updates in your account. Delivery charges are arranged separately with our team.</p>
    <div className="mt-8 flex flex-wrap justify-center gap-4"><Link href={`/order/${order.id}`} className="store-primary">View order &amp; track delivery</Link><Link href="/shop" className="store-secondary">Continue shopping</Link></div>
  </div>
}
