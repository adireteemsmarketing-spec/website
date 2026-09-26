import { notFound } from 'next/navigation'
import { readStore } from '@/lib/store-db'
import { ProductDetail } from '@/components/product-detail'
export const dynamic='force-dynamic'
export default async function ProductPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params
 const products=(await readStore()).products.filter(p=>p.status==='published')
 const product=products.find(p=>p.slug===slug)
 if(!product)notFound()
 return <ProductDetail product={product} products={products}/>
}
