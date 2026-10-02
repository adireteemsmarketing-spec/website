import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { brand } from '@/lib/brand'

export default function AboutPage() {
  return (
    <div className="overflow-hidden bg-black text-[#f5f3ef]">
      <section className="px-6 pb-24 pt-28 sm:px-10 md:pb-36 md:pt-44 lg:px-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-heading text-5xl leading-[0.94] tracking-[-0.05em] sm:text-7xl md:text-8xl">
            The Colours<br /><em className="font-heading text-[#e4c158]">of Africa.</em>
          </h1>
          <h2 className="mt-10 font-heading text-2xl text-[#e4c158]">Who we are</h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-zinc-400 sm:text-xl md:text-2xl">
            {brand.whoWeAre}
          </p>
        </div>
      </section>

      <GoldDivider />

      <section className="mx-auto grid max-w-[1440px] items-center gap-12 px-6 py-24 sm:px-10 md:grid-cols-2 md:gap-16 md:py-32 lg:px-16">
        <div className="max-w-lg md:pr-10">
          <h2 className="font-heading text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">Our<br />Story.</h2>
          <div className="mt-9 space-y-6 text-[15px] leading-relaxed text-zinc-500 sm:text-base">
            {brand.story.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <Link href="/shop" className="mt-10 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e4c158] transition hover:text-white">Explore our collection <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="aspect-[0.79] overflow-hidden bg-zinc-900 md:ml-auto md:max-w-[570px]">
          <img src="/images/Edited picture for kaldoni/Bubu gown/Adire bubu/adire-teems-adire-bubu-blue-side.png" alt="Adire Teems heritage collection" className="h-full w-full object-cover" />
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] items-center gap-14 px-6 py-12 sm:px-10 md:grid-cols-2 md:gap-24 md:py-24 lg:px-16">
        <div className="aspect-[0.79] overflow-hidden bg-zinc-900 md:max-w-[570px]">
          <img src="/images/Edited picture for kaldoni/Male 2 piece/adire-teems-2-piece-beige-face-men.jpg.png" alt="Adire Teems models" className="h-full w-full object-cover grayscale" />
        </div>
        <div className="max-w-xl md:pb-8">
          <p className="font-heading text-5xl leading-none text-[#e4c158]">“</p>
          <div className="mt-8">
            <h2 className="font-heading text-2xl">Mission</h2>
            <p className="mt-5 text-lg leading-relaxed text-zinc-500">{brand.mission}</p>
          </div>
          <div className="my-10 h-px w-40 bg-zinc-800" />
          <div>
            <h2 className="font-heading text-2xl">Vision</h2>
            <p className="mt-5 text-[15px] leading-relaxed text-zinc-500">{brand.vision}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 py-12"><h2 className="font-heading text-3xl text-[#e4c158]">Our Core Values</h2><ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{brand.values.map(value=><li key={value} className="border border-zinc-700 p-5">{value}</li>)}</ul><p className="mt-10 text-zinc-300">Visit us at {brand.address}.</p><a className="mt-3 inline-block text-[#e4c158] underline" href={`mailto:${brand.email}`}>{brand.email}</a></section>
      <div className="px-6 pb-24 pt-20 sm:px-10 md:pb-32 md:pt-28 lg:px-16"><GoldDivider /></div>
    </div>
  )
}

function GoldDivider() { return <div className="mx-auto max-w-[1440px] border-t border-dashed border-[#9a7d19]" /> }
