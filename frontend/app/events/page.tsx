import type { Metadata } from 'next'
import Link from 'next/link'
import { brand } from '@/lib/brand'

export const metadata: Metadata = {
  title: 'Events & Exhibitions | Adire Teems',
  description: 'Connect with Adire Teems about exhibitions, pop-ups, collaborations and visits to our Lekki lounge.',
}

export default function EventsPage() {
  return <section className="store-shell max-w-5xl">
    <header className="mb-12 max-w-3xl"><p className="store-eyebrow">The Colours of Africa, together</p><h1 className="mt-3 font-heading text-4xl sm:text-5xl">Events &amp; exhibitions</h1><p className="mt-6 text-lg leading-8 text-zinc-400">Meet Adire Teems through fashion, textiles and conversations about African cultural heritage.</p></header>
    <div className="grid gap-6 md:grid-cols-2">
      <section className="store-panel"><h2 className="font-heading text-2xl">Ask about upcoming events</h2><p className="my-5 leading-7 text-zinc-400">For confirmed dates, venues and attendance details for exhibitions, pop-ups or in-store events, contact our team before making travel plans.</p><Link href="/contact" className="store-primary inline-block">Enquire about events</Link></section>
      <section className="store-panel"><h2 className="font-heading text-2xl">Visit our lounge</h2><p className="my-5 leading-7 text-zinc-400">{brand.address}. Get in touch to arrange your visit and discuss the pieces you would like to see.</p><a href={brand.phones[0].href} className="text-[#e4c158] underline">Call {brand.phones[0].label}</a></section>
    </div>
    <section className="mt-12 border-t border-zinc-700 pt-8"><h2 className="font-heading text-3xl">African fashion across borders</h2><p className="mt-5 max-w-3xl leading-8 text-zinc-400">Adire Teems has participated in exhibitions and fashion shows in London, Cape Town, Ghana, Algeria and Banjul. These experiences are part of our story of bringing African fashion and textiles to a wider audience.</p><Link href="/about" className="mt-5 inline-block text-[#e4c158] underline">Read our story</Link></section>
    <section className="mt-12"><h2 className="font-heading text-2xl">Collaborate with us</h2><p className="mt-4 leading-7 text-zinc-400">Planning an exhibition, fashion event or brand collaboration? Email <a href={`mailto:${brand.email}`} className="break-words text-[#e4c158] underline">{brand.email}</a> with your proposed date, location and event details.</p></section>
  </section>
}
