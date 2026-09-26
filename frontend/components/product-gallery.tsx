'use client'
import { useState } from 'react'
import type { Product } from '@/lib/catalog'

export function ProductGallery({ product }: { product: Product }) {
  const [selected, setSelected] = useState(0)
  const images = product.images?.length ? product.images : [{ url: product.image, alt: product.name }]
  const current = images[selected] || images[0]
  return <div>
    <img src={current.url} alt={current.alt} className="aspect-[3/4] w-full rounded-sm object-cover" />
    {images.length > 1 && <div className="mt-4 flex flex-wrap gap-3" aria-label="Product image gallery">
      {images.map((image, index) => <button key={image.url} type="button" aria-label={`View ${index === 0 ? 'front' : 'alternate'} image of ${product.name}`} aria-pressed={selected === index} onClick={() => setSelected(index)} className={`overflow-hidden rounded border-2 ${selected === index ? 'border-[#e4c158]' : 'border-zinc-600'}`}>
        <img src={image.url} alt={image.alt} className="h-28 w-20 object-cover" />
      </button>)}
    </div>}
  </div>
}
