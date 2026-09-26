'use client'
import { useCurrency } from '@/components/currency-provider'
import Link from 'next/link'
import { Product } from '@/lib/catalog'
import { ProductPurchase } from '@/components/product-purchase'
import { ProductGallery } from '@/components/product-gallery'

export function ProductDetail({ product, products = [] }: { product: Product; products?: Product[] }) {
  const { money } = useCurrency()
  return <section className="store-shell">
    <nav className="mb-10 text-sm text-zinc-400"><Link href="/">Home</Link> / <Link href="/shop">Shop</Link> / {product.name}</nav>
    <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
      <ProductGallery key={product.id} product={product} />
      <div className="lg:pt-8"><p className="mb-4 text-xs uppercase tracking-[.2em] text-[#e4c158]">The Adire Collection</p>
        <h1 className="font-heading text-4xl md:text-5xl">{product.name}</h1><p className="my-6 text-2xl text-[#e4c158]">{money(product.price, product.currency)}</p>
        <p className="mb-8 leading-7 text-zinc-400">{product.description}</p><ProductPurchase product={product} />
        <div className="mt-8 space-y-4 border-t border-zinc-700 pt-6">
          <details><summary className="cursor-pointer">Product details</summary><p className="mt-3 text-sm leading-7 text-zinc-400">Fabric / detail: {product.fabric}<br />Category: {product.category.replaceAll('-', ' ')}<br />Product code: {product.sku}</p></details>
          <details><summary className="cursor-pointer">Care & sizing</summary><p className="mt-3 text-sm leading-7 text-zinc-400">Follow the garment care label. Need help choosing your fit or fabric length? <Link href="/contact" className="text-[#e4c158] underline">Contact our team</Link> before ordering.</p></details>
        </div>
      </div>
    </div>
    <h2 className="mb-6 mt-20 font-heading text-3xl">You may also like</h2><div className="grid grid-cols-2 gap-5 md:grid-cols-4">{products.filter(item => item.id !== product.id).slice(0, 4).map(item => <Link key={item.id} href={`/product/${item.slug}`}><img src={item.image} alt={item.name} className="mb-4 aspect-[3/4] w-full rounded object-cover" /><h3>{item.name}</h3><p className="mt-2 text-[#e4c158]">{money(item.price, item.currency)}</p></Link>)}</div>
  </section>
}
