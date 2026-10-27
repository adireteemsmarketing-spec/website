import { notFound } from 'next/navigation'
import type { Metadata, ResolvingMetadata } from 'next'
import { cache } from 'react'
import { readStore } from '@/lib/store-db'
import { productDescription } from '@/lib/product-seo'
import { ProductDetail } from '@/components/product-detail'
export const dynamic='force-dynamic'
const publishedProducts = cache(async () => (await readStore()).products.filter(p => p.status === 'published'))

export async function generateMetadata({params}:{params:Promise<{slug:string}>}, parent: ResolvingMetadata): Promise<Metadata> {
 const {slug}=await params
 const product=(await publishedProducts()).find(p=>p.slug===slug)
 if(!product)notFound()
 const inherited=await parent
 const description=productDescription(product)
 return {
   title:product.seoTitle || `${product.name} | Adire Teems`,
   description,
   alternates:{canonical:product.canonicalUrl || `https://adireteems.com/product/${product.slug}`,languages:inherited.alternates?.languages||undefined,media:inherited.alternates?.media||undefined,types:inherited.alternates?.types||undefined},
   openGraph:{...inherited.openGraph,title:product.seoTitle || `${product.name} | Adire Teems`,description},
   ...(product.noindex ? {robots:{index:false,follow:true}} : {}),
 }
}
export default async function ProductPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params
 const products=await publishedProducts()
 const product=products.find(p=>p.slug===slug)
 if(!product)notFound()
 return <ProductDetail product={product} products={products}/>
}
