import Link from 'next/link'
import type { CustomerOrder } from '@/lib/customer-types'

export function OrderPackingItems({ order }: { order: CustomerOrder }) {
  return <details className="my-5 rounded-lg border border-zinc-300">
    <summary className="cursor-pointer px-4 py-3 font-semibold">View purchased products ({order.order_items.length})</summary>
    <div className="space-y-5 border-t border-zinc-200 p-4">
      {order.order_items.map(item => <article key={item.id} className="border-b border-zinc-200 pb-5 last:border-0 last:pb-0">
        <h3 className="font-semibold">{item.product_name}</h3>
        <p className="mt-1 text-sm">Size: {item.size || 'Not specified'} · Quantity: {item.quantity}{item.color && ` · Colour: ${item.color}`}</p>
        {item.sku && <p className="mt-1 text-sm">SKU: {item.sku}</p>}
        {item.images?.length ? <div className="mt-3 flex flex-wrap gap-3">{item.images.map((image, index) => <a key={`${image.url}-${index}`} href={image.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${item.product_name} image ${index + 1} in a new tab`} className="block rounded border border-zinc-300 p-1"><img src={image.url} alt={image.alt} loading="lazy" className="h-40 w-32 object-contain" /></a>)}</div> : <p className="mt-3 text-sm text-zinc-500">No product image available. Use the name, SKU and size above for packing.</p>}
        {item.productUrl && <Link href={item.productUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm underline">View product details</Link>}
      </article>)}
    </div>
  </details>
}
