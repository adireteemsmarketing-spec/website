'use client'
import { useStore } from './store-provider'
export function MediaGallery() {
  const {posts}=useStore()
  if(!posts.length)return null
  return <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">{posts.slice(0,4).map(post=><a key={post.id} href={'/blog/'+post.slug} className="overflow-hidden rounded-md border border-zinc-700 bg-[#171717]"><img src={post.image} alt={post.title} className="h-48 w-full object-cover"/><div className="p-3"><h4 className="text-sm font-semibold text-white">{post.title}</h4><p className="mt-1 text-xs text-zinc-400">{post.excerpt}</p></div></a>)}</div>
}
export default MediaGallery
