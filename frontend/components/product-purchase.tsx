'use client'
import { useCurrency } from '@/components/currency-provider'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, X } from 'lucide-react'
import { Product, sizes } from '@/lib/catalog'
import { useCart } from './cart-provider'

export function ProductPurchase({ product }: { product: Product }) {
  const { money } = useCurrency()
  const [size, setSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState('')
  const { add, ready } = useCart()
  const router = useRouter()
  const available=product.inStock!==undefined ? ((size?product.availableSizes?.includes(size):product.inStock)?10:0) : Math.min(10,product.stock??0)
  function purchase(checkout: boolean) {
    if(!available){setMessage('This product is out of stock.');return}
    if (!size) { setMessage('Please choose your size.'); return }
    add(product.id, size, quantity)
    router.push(checkout ? '/checkout' : '/cart')
  }
  return <div className="space-y-6">
    <fieldset><legend className="mb-3 text-sm">Select size</legend><div className="flex flex-wrap gap-2">{(product.sizes || sizes).map(value => <button key={value} disabled={Boolean(product.availableSizes && !product.availableSizes.includes(value))} type="button" aria-pressed={value === size} onClick={() => { setSize(value); setMessage('') }} className={`h-11 min-w-11 border px-3 ${value === size ? 'border-[#e4c158] bg-[#e4c158] text-black' : 'border-zinc-600 hover:border-[#e4c158]'}`}>{value}</button>)}</div></fieldset>
    <label className="flex items-center gap-4 text-sm">Quantity<select className="border border-zinc-600 bg-[#171717] px-4 py-3" value={quantity} onChange={e => setQuantity(Number(e.target.value))}>{Array.from({length:available}, (_, i) => <option key={i} value={i+1}>{i+1}</option>)}</select></label>
    <div className="grid gap-3"><button disabled={!ready || !available} onClick={() => purchase(false)} className="store-primary">Add to Cart — {money(product.price * quantity,product.currency)}</button><button disabled={!ready || !available} onClick={() => purchase(true)} className="store-secondary">Buy Now</button></div>
    <p role="status" className="text-sm text-[#e4c158]">{!available ? "Out of stock" : message}</p>
  </div>
}
export function QuickAdd({ product }: { product: Product }) {
  const dialog = useRef<HTMLDialogElement>(null)
  return <><button onClick={() => dialog.current?.showModal()} aria-label={`Add ${product.name} to bag`} className="grid h-9 w-9 place-items-center rounded-full border border-zinc-600 text-[#e4c158] hover:bg-[#e4c158] hover:text-black"><ShoppingBag className="h-4 w-4" /></button><dialog ref={dialog} aria-label={`Choose size for ${product.name}`} className="fixed inset-0 m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-md overflow-auto border border-zinc-600 bg-[#171717] p-6 text-white backdrop:bg-black/80"><div className="mb-5 flex items-start justify-between gap-3"><h2 className="font-heading text-2xl">{product.name}</h2><button autoFocus aria-label="Close size selection" onClick={() => dialog.current?.close()}><X /></button></div><ProductPurchase product={product}/><Link href={`/product/${product.slug}`} className="text-sm underline">View full product details</Link></dialog></>
}
