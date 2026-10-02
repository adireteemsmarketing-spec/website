'use client'
import { useCurrency } from '@/components/currency-provider'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, X } from 'lucide-react'
import { Product, sizes } from '@/lib/catalog'
import { useCart } from './cart-provider'

export function ProductPurchase({ product, onContinue }: { product: Product; onContinue?: () => void }) {
  const { money } = useCurrency()
  const [size, setSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState('')
  const [added, setAdded] = useState('')
  const { add, ready, items } = useCart()
  const router = useRouter()
  const available=product.inStock!==undefined ? ((size?product.availableSizes?.includes(size):product.inStock)?10:0) : Math.min(10,product.stock??0)
  function purchase(checkout: boolean) {
    if(!available){setMessage('This product is out of stock.');return}
    if (!size) { setMessage('Please choose your size.'); return }
    if (!ready) return
    const existing = items.find(item => item.productId === product.id && item.size === size)?.quantity || 0
    if (existing + quantity > available) { setMessage(`You already have ${existing} in your cart. Reduce the quantity or view your cart.`); return }
    add(product.id, size, quantity)
    if (checkout) router.push('/checkout')
    else { setAdded(size); setMessage('') }
  }
  return <div className="space-y-6">
    <fieldset><legend className="mb-3 text-sm">Select size</legend><div className="flex flex-wrap gap-2">{(product.sizes || sizes).map(value => <button key={value} disabled={Boolean(product.availableSizes && !product.availableSizes.includes(value))} type="button" aria-pressed={value === size} onClick={() => { setSize(value); setMessage('') }} className={`h-11 min-w-11 border px-3 ${value === size ? 'border-[#e4c158] bg-[#e4c158] text-black' : 'border-zinc-600 hover:border-[#e4c158]'}`}>{value}</button>)}</div></fieldset>
    <label className="flex items-center gap-4 text-sm">Quantity<select className="border border-zinc-600 bg-[#171717] px-4 py-3" value={quantity} onChange={e => setQuantity(Number(e.target.value))}>{Array.from({length:available}, (_, i) => <option key={i} value={i+1}>{i+1}</option>)}</select></label>
    <div className="grid gap-3"><button disabled={!ready || !available} onClick={() => purchase(false)} className="store-primary">Add to Cart — {money(product.price * quantity,product.currency)}</button><button disabled={!ready || !available} onClick={() => purchase(true)} className="store-secondary">Buy Now</button></div>
    <p role="status" className="text-sm text-[#e4c158]">{!available ? "Out of stock" : message}</p>
    {added && <div className={`${onContinue ? 'sticky bottom-4' : 'fixed bottom-4 left-4 right-4 sm:left-auto sm:w-96'} z-50 rounded-lg border border-[#e4c158] bg-[#171717] p-5 shadow-xl`}>
      <div className="flex items-start justify-between gap-3"><p role="status" className="flex items-center gap-2 text-[#e4c158]"><Check aria-hidden="true" className="h-5 w-5 shrink-0" />Added to your cart</p><button type="button" aria-label="Dismiss cart confirmation" onClick={() => setAdded('')}><X className="h-5 w-5" /></button></div>
      <p className="mt-2 text-sm text-zinc-300">{product.name} · Size {added}</p>
      <div className="mt-4 flex flex-wrap gap-3"><Link href="/cart" className="store-primary inline-block">View cart</Link><button type="button" className="store-secondary" onClick={() => { setAdded(''); if (onContinue) onContinue(); else router.push('/shop') }}>Continue shopping</button></div>
    </div>}
  </div>
}
export function QuickAdd({ product }: { product: Product }) {
  const dialog = useRef<HTMLDialogElement>(null)
  return <><button onClick={() => dialog.current?.showModal()} aria-label={`Add to cart: ${product.name}`} className="min-h-11 rounded border border-[#e4c158] px-4 py-2 text-sm font-semibold text-[#e4c158] hover:bg-[#e4c158] hover:text-black">Add to cart</button><dialog ref={dialog} aria-label={`Choose size for ${product.name}`} className="fixed inset-0 m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-md overflow-auto border border-zinc-600 bg-[#171717] p-6 text-white backdrop:bg-black/80"><div className="mb-5 flex items-start justify-between gap-3"><h2 className="font-heading text-2xl">{product.name}</h2><button autoFocus aria-label="Close size selection" onClick={() => dialog.current?.close()}><X /></button></div><ProductPurchase product={product} onContinue={() => dialog.current?.close()}/><Link href={`/product/${product.slug}`} className="text-sm underline">View full product details</Link></dialog></>
}
