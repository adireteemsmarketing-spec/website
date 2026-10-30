import type { Metadata } from 'next'
import Link from 'next/link'
import { OrderList } from '@/components/customer-orders'

export const metadata: Metadata = {
  title: 'Order Tracking | Adire Teems',
  description: 'Sign in to view your Adire Teems orders, payment confirmation and delivery updates.',
  robots: { index: false, follow: true },
}

export default function OrderTrackingPage() {
  return <section className="store-shell max-w-4xl">
    <p className="store-eyebrow">Your Adire Teems order</p>
    <h1 className="mt-3 font-heading text-4xl sm:text-5xl">Track your order</h1>
    <p className="my-6 max-w-2xl leading-7 text-zinc-400">Sign in with the account used at checkout, then select an order to see its payment status, preparation progress and delivery updates. Carrier details appear when our team adds them.</p>
    <OrderList />
    <aside className="mt-10 border-t border-zinc-700 pt-6 text-sm leading-7 text-zinc-400">Need help finding a purchase? <Link href="/contact" className="text-[#e4c158] underline">Contact our team</Link> with your order number. Keep your password and payment details private.</aside>
  </section>
}
