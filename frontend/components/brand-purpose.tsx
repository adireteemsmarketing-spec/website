import { brand } from '@/lib/brand'

export function BrandPurpose({ showValues = false }: { showValues?: boolean }) {
  return <section aria-label="Our purpose" className="mx-auto max-w-[1280px] px-6 py-12 text-white md:px-12">
    <div className="grid gap-8 md:grid-cols-2">
      <div><h2 className="font-heading text-2xl text-[#e4c158]">Our Vision</h2><p className="mt-3 leading-7 text-zinc-300">{brand.vision}</p></div>
      <div><h2 className="font-heading text-2xl text-[#e4c158]">Our Mission</h2><p className="mt-3 leading-7 text-zinc-300">{brand.mission}</p></div>
    </div>
    {showValues && <div className="mt-10"><h2 className="font-heading text-2xl text-[#e4c158]">Our Core Values</h2><ul className="mt-5 flex flex-wrap gap-3">{brand.values.map(value => <li key={value} className="rounded border border-zinc-700 px-4 py-2 text-sm text-zinc-300">{value}</li>)}</ul></div>}
  </section>
}
