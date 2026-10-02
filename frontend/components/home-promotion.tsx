'use client'
import Link from 'next/link'
import { useStore } from './store-provider'

export function HomePromotion() {
  const { promotion } = useStore()
  if (!promotion?.published || !promotion.title) return null
  return <section aria-label="Latest from Adire Teems" className="bg-[#0d0d0d] px-6 pb-16 md:px-12 lg:px-16">
    <div className={`mx-auto grid max-w-[1280px] items-center gap-8 overflow-hidden rounded-xl border border-zinc-700 bg-[#1c1b1b] p-6 md:p-10 ${promotion.image ? 'md:grid-cols-2' : ''}`}>
      <div><h2 className="whitespace-pre-line font-heading text-4xl leading-tight text-white">{promotion.title}</h2><p className="mt-5 whitespace-pre-line leading-7 text-zinc-300">{promotion.description}</p>
        {promotion.linkUrl && promotion.linkLabel && <Link href={promotion.linkUrl} className="mt-7 inline-flex min-h-11 items-center rounded border border-white px-5 py-3 text-sm text-white hover:bg-white/10">{promotion.linkLabel}</Link>}
      </div>
      {promotion.image && <img src={promotion.image} alt={promotion.title} className="max-h-[480px] w-full rounded-xl object-contain" />}
    </div>
  </section>
}
