 'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import { useStore } from '@/components/store-provider'
import { Suspense } from 'react'
import { QuickAdd } from '@/components/product-purchase'
import { useCurrency } from '@/components/currency-provider'
import { styleGroups, matchesStyle } from '@/lib/styles'
import MediaGallery from '@/components/media-gallery'

const categoryOptions = [['all', 'All Pieces'], ['women', 'Women'], ['men', 'Men'], ['kids', 'Kids'], ['rest', 'Other']] as const

function matchesPrice(price: number, selected: string) {
  if (selected === 'under') return price < 500
  if (selected === 'mid') return price >= 500 && price <= 1000
  if (selected === 'over') return price > 1000
  return true
}

function ShopContent() {
  const { money, currency, toUsd } = useCurrency()
  const priceOptions = [['all', 'All prices'], ['under', 'Under ' + money(500)], ['mid', money(500) + ' - ' + money(1000)], ['over', 'Over ' + money(1000)]]

  const { products: productsSource, posts } = useStore()
  const fabricOptions = ['all', ...Array.from(new Set(productsSource.map(p => p.fabric).filter(Boolean))).sort()]
  const canComparePrices=productsSource.every(p=>toUsd(p.price,p.currency)!==null)
  const [category, setCategory] = useState<string>('all')
  const [styleGroup, setStyleGroup] = useState('')
  const [style, setStyle] = useState('')
  const [price, setPrice] = useState<string>('all')
  const [fabric, setFabric] = useState<string>('all')
  const [sort, setSort] = useState('featured')
  const [query, setQuery] = useState('')


  const filteredProducts = useMemo(() => {
    const source = productsSource
    const results = source.filter((product) => {
      if (category === 'all') return true
      if(product.department)return category==='rest' ? ['rest','accessories','others'].includes(product.department) : product.department===category
      const name = product.name.toLowerCase()
      const isKids = name.includes('kid') || name.includes('kids')
      const isWomen = ['dresses', 'sets'].includes(product.category)
      const isMen = ['sets', 'robes'].includes(product.category) // best-effort mapping for menswear

      if (category === 'women') return isWomen
      if (category === 'men') return isMen
      if (category === 'kids') return isKids
      if (category === 'rest') return !isWomen && !isMen && !isKids

      return product.category === category
    }).filter((product) => matchesStyle(product, styleGroup, style) && (!canComparePrices || matchesPrice(toUsd(product.price,product.currency)!, price)) && (fabric === 'all' || product.fabric === fabric) && `${product.name} ${product.description} ${product.fabric}`.toLowerCase().includes(query.toLowerCase().trim()))
    return [...results].sort((a, b) => canComparePrices && sort === 'low' ? toUsd(a.price,a.currency)! - toUsd(b.price,b.currency)! : canComparePrices && sort === 'high' ? toUsd(b.price,b.currency)! - toUsd(a.price,a.currency)! : 0)
  }, [category, price, fabric, sort, query, productsSource, styleGroup, style, canComparePrices, toUsd])
  const clearFilters = () => { setCategory('all'); setStyleGroup(''); setStyle(''); setPrice('all'); setFabric('all'); setQuery('') }
  const activeFilters = [styleGroup && (style ? styleGroup + ": " + style : styleGroup),category !== 'all' && categoryOptions.find(([value]) => value === category)?.[1], price !== 'all' && priceOptions.find(([value]) => value === price)?.[1], fabric !== 'all' && fabric].filter(Boolean) as string[]

  // Read category from URL query param and map to internal filters
  const searchParams = useSearchParams()
  useEffect(() => {
    const cat = searchParams?.get('category')
    // Synchronize navigation from the homepage collection links.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (cat) setCategory(cat)
  }, [searchParams])

  return <section className="min-h-screen bg-[#0d0d0d] px-4 pb-20 pt-10 text-[#f5f3ef] sm:px-8 lg:px-16 lg:pt-14">
    <div className="mx-auto max-w-[1420px]">
      <div className="mb-7 flex min-h-8 flex-wrap items-center gap-2 lg:pl-[280px]"><span className="mr-3 text-[11px] tracking-[0.12em] text-zinc-500">ACTIVE FILTERS:</span>{activeFilters.length ? activeFilters.map((filter) => <button key={filter} onClick={clearFilters} className="flex items-center gap-1 border border-zinc-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] transition hover:border-[#e4c158] hover:text-[#e4c158]">{filter} <X className="h-3 w-3" /></button>) : <span className="text-sm text-zinc-500">Browse the collection</span>}</div>
      <div className="grid gap-6 lg:grid-cols-[256px_minmax(0,1fr)] lg:gap-7">
        <aside className="flex max-h-[65dvh] min-h-0 flex-col self-start overflow-hidden rounded-md border border-zinc-700 bg-[#171717] lg:sticky lg:top-40 lg:max-h-[calc(100dvh-11rem)]">
          <div className="mx-6 flex shrink-0 items-center justify-between border-b border-dashed border-[#b89a25] py-6"><h1 className="font-heading text-[27px] font-medium">Filters</h1><button onClick={clearFilters} className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 hover:text-[#e4c158]">Clear all</button></div>
          <div className="shop-filter-scroll min-h-0 px-6 pb-3 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#e4c158]" tabIndex={0} role="region" aria-label="Scroll product filters">
          <FilterGroup title="Category">{categoryOptions.map(([value, label]) => <CheckOption key={value} label={label} checked={category === value} onChange={() => setCategory(value)} />)}</FilterGroup>
          <FilterGroup title="Styles"><RadioOption label="All styles" checked={!styleGroup} onChange={()=>{setStyleGroup('');setStyle('')}} />{styleGroups.map(group=><details key={group.name} className="border-t border-zinc-700 pt-3"><summary className="cursor-pointer text-sm text-zinc-200">{group.name}{styleGroup===group.name && <span className="ml-2 text-[#e4c158]">(selected)</span>}</summary><div className="mt-3 space-y-3 pl-3"><RadioOption label={'All ' + group.name} checked={styleGroup===group.name && !style} onChange={()=>{setStyleGroup(group.name);setStyle('')}} />{group.styles.map(option=><RadioOption key={option} label={option} checked={styleGroup===group.name && style===option} onChange={()=>{setStyleGroup(group.name);setStyle(option)}} />)}</div></details>)}</FilterGroup>
          {canComparePrices&&<FilterGroup title={`Price (${currency})`}>{priceOptions.map(([value, label]) => <RadioOption key={value} label={label} checked={price === value} onChange={() => setPrice(value)} />)}</FilterGroup>}
          <FilterGroup title="Fabrics" last>{fabricOptions.map((value) => <RadioOption key={value} label={value === 'all' ? 'All fabrics' : value} checked={fabric === value} onChange={() => setFabric(value)} />)}</FilterGroup>
          </div>
        </aside>
        <div>
          <label className="mb-5 block text-xs uppercase tracking-widest text-zinc-400">Search collection<input id="search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search pieces or fabrics" className="mt-2 block w-full scroll-mt-28 border border-zinc-700 bg-[#171717] p-3 text-sm normal-case tracking-normal text-white" /></label>
          <div className="mb-5 flex items-center justify-between border-b border-zinc-800 pb-4"><p className="text-sm text-zinc-400"><span className="text-[#e4c158]">{filteredProducts.length}</span> pieces selected</p><select disabled={!canComparePrices} value={sort} onChange={(event) => setSort(event.target.value)} className="bg-transparent text-xs uppercase tracking-[0.12em] text-zinc-400 outline-none"><option className="bg-[#171717]" value="featured">Sort: Featured</option><option className="bg-[#171717]" value="low">Price: Low to high</option><option className="bg-[#171717]" value="high">Price: High to low</option></select></div>
          {filteredProducts.length ? <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{filteredProducts.map((product) => <article key={product.id} className="group overflow-hidden rounded-md border border-zinc-700 bg-[#171717] transition duration-300 hover:-translate-y-1 hover:border-zinc-500"><Link href={`/product/${product.slug}`} className="relative block aspect-[3/4] overflow-hidden bg-zinc-800"><img src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />{product.badge && <span className="absolute left-4 top-4 bg-[#e4c158] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-black">{product.badge}</span>}</Link><div className="p-4"><h2 className="text-[15px] font-semibold tracking-[-0.01em]"><Link href={`/product/${product.slug}`}>{product.name}</Link></h2><p className="mt-1 text-sm text-zinc-400">{product.description}</p><div className="mt-4 flex items-center justify-between"><span className="text-lg font-bold text-[#e4c158]">{money(product.price,product.currency)}</span><QuickAdd product={product} /></div></div></article>)}</div> : <div className="grid min-h-80 place-items-center border border-dashed border-zinc-700 text-center"><div><p className="font-heading text-2xl">No pieces found</p><button onClick={clearFilters} className="mt-3 text-sm text-[#e4c158] underline underline-offset-4">Clear filters</button></div></div>}
          <p className="mt-10 border-t border-zinc-800 pt-6 text-center text-sm text-zinc-400">You have viewed all {filteredProducts.length} pieces</p>
        </div>
        {posts.length > 0 && <section className="lg:col-span-2 mt-10 border-t border-zinc-700 pt-8"><h2 className="mb-5 font-heading text-3xl">From the Journal</h2><div className="grid gap-5 sm:grid-cols-3">{posts.slice(0,3).map(post=><Link key={post.id} href={`/blog/${post.slug}`} className="border border-zinc-700 p-5"><h3 className="font-heading text-xl">{post.title}</h3><p className="mt-3 text-sm text-zinc-400">{post.excerpt}</p><span className="mt-4 block text-[#e4c158]">Read article</span></Link>)}</div></section>}
        <MediaGallery />
      </div>
    </div>
  </section>
}

function FilterGroup({ title, children, last = false }: { title: string; children: React.ReactNode; last?: boolean }) { return <fieldset className={`py-6 ${last ? '' : 'border-b border-dashed border-[#b89a25]'}`}><legend className="mb-4 text-[15px] font-semibold">{title}</legend><div className="space-y-3">{children}</div></fieldset> }
function CheckOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) { return <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-300"><input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" /><span className="grid h-4 w-4 place-items-center border border-zinc-500 peer-checked:border-[#e4c158] peer-checked:bg-[#e4c158] peer-checked:text-black">{checked && '✓'}</span>{label}</label> }
function RadioOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) { return <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-300"><input type="radio" checked={checked} onChange={onChange} className="peer sr-only" /><span className="h-4 w-4 rounded-full border border-zinc-500 p-1 peer-checked:border-[#e4c158]"><span className={`block h-full w-full rounded-full ${checked ? 'bg-[#e4c158]' : ''}`} /></span>{label}</label> }

export default function ShopPage(){return <Suspense fallback={<p>Loading shop�</p>}><ShopContent/></Suspense>}
