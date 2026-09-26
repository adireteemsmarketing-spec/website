import Link from 'next/link'
import { readStore } from '@/lib/store-db'
export const dynamic='force-dynamic'
export default async function BlogPage({searchParams}:{searchParams:Promise<{category?:string}>}){
 const {category}=await searchParams
 const all=(await readStore()).posts.filter(p=>p.status==='published')
 const posts=category?all.filter(p=>p.category===category):all
 return <section className="store-shell"><header className="mb-12 text-center"><p className="store-eyebrow">Stories, culture & craftsmanship</p><h1 className="font-heading text-5xl">The Heritage Journal</h1><p className="mt-5 text-zinc-400">Explore African fashion, fabrics, and the stories behind Adire Teems.</p></header><nav className="mb-10 flex flex-wrap justify-center gap-5"><Link className="text-[#e4c158] underline" href="/blog">All Stories</Link>{Array.from(new Set(all.map(p=>p.category))).map(c=><Link key={c} href={`/blog?category=${encodeURIComponent(c)}`} className="underline">{c}</Link>)}</nav>{!posts.length?<p className="store-panel text-center">New stories are coming soon.</p>:<div className="grid gap-8 md:grid-cols-3">{posts.map(p=><article key={p.id}><Link href={`/blog/${p.slug}`}><img className="aspect-[4/3] w-full rounded object-cover" src={p.image} alt={p.title}/><p className="my-4 text-xs uppercase tracking-widest text-[#e4c158]">{p.category} · {p.date}</p><h2 className="font-heading text-3xl">{p.title}</h2><p className="my-4 text-zinc-400">{p.excerpt}</p><span className="text-sm underline">Read article</span></Link></article>)}</div>}</section>
}

