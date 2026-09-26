'use client'
import Link from 'next/link'
import { useCart } from '@/components/cart-provider'
import { useCurrency } from '@/components/currency-provider'
import { useStore } from '@/components/store-provider'

export default function CartPage() {
  const { money } = useCurrency()
  const { products } = useStore()
  const { items, ready, update, syncError, retrySync } = useCart()
  const subtotals = items.reduce<Record<string, number>>((totals, item) => {
    const product = products.find(p => p.id === item.productId)
    if (product) { const code = product.currency || 'NGN'; totals[code] = (totals[code] || 0) + product.price * item.quantity }
    return totals
  }, {})
  return <section className="store-shell">
    <Link href="/dashboard" className="mb-5 inline-block text-sm underline">← Your dashboard</Link>
    <p className="store-eyebrow">Your selection</p><h1 className="mb-8 font-heading text-4xl">Shopping Bag</h1>
    {syncError && <p role="alert" className="mb-5 text-amber-300">{syncError} <button onClick={retrySync} className="underline">Retry sync</button></p>}
    {!ready ? <p role="status">Loading your bag…</p> : !items.length ? <div className="store-panel py-16 text-center">
      <h2 className="font-heading text-2xl">Your bag is empty</h2><p className="my-4 text-zinc-400">Explore the collection and find your next favourite piece.</p>
      <Link href="/shop" className="store-primary inline-block">Explore the collection</Link>
    </div> : <div className="grid gap-10 lg:grid-cols-[1.7fr_1fr]"><div>{items.map(item => {
      const product = products.find(p => p.id === item.productId)
      return <article key={`${item.productId}-${item.size}`} className="flex gap-5 border-b border-zinc-700 py-6">
        {product && <Link href={`/product/${product.slug}`}><img src={product.image} alt={product.name} className="h-36 w-24 rounded object-cover sm:w-28" /></Link>}
        <div className="flex-1">{product ? <Link href={`/product/${product.slug}`} className="font-heading text-xl">{product.name}</Link> : <p>Product no longer available. Remove it before checking out.</p>}
          <p className="my-2 text-sm text-zinc-400">Size: {item.size}{product && ` · ${money(product.price, product.currency)} each`}</p>
          <div className="flex flex-wrap items-center gap-4"><label className="text-sm">Quantity <select aria-label={`Quantity for ${product?.name || 'unavailable product'}, size ${item.size}`} value={item.quantity} onChange={e => update(item.productId, item.size, Number(e.target.value))} className="ml-2 border border-zinc-600 bg-[#171717] p-2">{Array.from({ length: 10 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>
            <button onClick={() => update(item.productId, item.size, 0)} className="text-sm text-zinc-400 underline">Remove</button></div>
          {product && <p className="mt-3 text-[#e4c158]">{money(product.price * item.quantity, product.currency)}</p>}
        </div>
      </article>
    })}<Link href="/shop" className="mt-6 inline-block text-sm underline">Continue shopping</Link></div>
      <aside className="store-panel h-fit"><h2 className="mb-6 font-heading text-2xl">Order summary</h2><div className="flex justify-between"><span>Items subtotal</span><span>{Object.entries(subtotals).map(([code, total]) => <span className="block" key={code}>{money(total, code)}</span>)}</span></div>
        <p className="my-5 text-sm text-zinc-400">Delivery and any applicable taxes are confirmed before payment.</p><Link href="/checkout" className="store-primary block text-center">Proceed to checkout</Link></aside>
    </div>}
  </section>
}
