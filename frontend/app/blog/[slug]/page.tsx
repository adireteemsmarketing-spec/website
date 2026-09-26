import Link from 'next/link'
import { notFound } from 'next/navigation'
import { readStore } from '@/lib/store-db'
export const dynamic='force-dynamic'
export default async function BlogPostPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params
 const post=(await readStore()).posts.find(p=>p.slug===slug&&p.status==='published')
 if(!post)notFound()
 return <article className="store-shell"><Link href="/blog" className="text-sm underline">Back to Journal</Link><header className="mx-auto my-12 max-w-4xl text-center"><p className="store-eyebrow">{post.category}</p><h1 className="font-heading text-5xl">{post.title}</h1><p className="mt-6 text-zinc-400">By {post.author} · <time>{post.date}</time></p></header><img src={post.image} alt={post.title} className="mx-auto max-h-[600px] w-full rounded object-cover"/><div className="mx-auto mt-12 max-w-3xl space-y-6 text-lg leading-8 text-zinc-300">{post.content.split(/\n\s*\n/).map((paragraph,index)=><p className="whitespace-pre-wrap" key={index}>{paragraph}</p>)}</div><Link href="/shop" className="store-primary mx-auto mt-12 block w-fit">Explore the Collection</Link></article>
}

