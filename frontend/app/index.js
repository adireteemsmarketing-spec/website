'use client'

import { useEffect, useState } from 'react'
import Link from "next/link";
import { HomePromotion } from '@/components/home-promotion'
import ReviewSlider from '@/components/review-slider'
import { ChevronDown } from 'lucide-react'
import { brand } from '@/lib/brand'

const categoryCards = [
  { title: 'Women', href: '/shop?category=women', image: '/images/Edited picture for kaldoni/Womens 2 piece/adire-teems-womens-maroon-soft-cotton-2-piece-set-front.jpg.png' },
  { title: 'Men', href: '/shop?category=men', image: '/images/Edited picture for kaldoni/Male 2 piece/adire-teems-2-piece-green-men.jpg.png' },
  { title: 'Kids', href: '/shop?category=kids', image: '/images/Edited picture for kaldoni/Childrens wear/adire-teems-kids-adire-dress-multicolour.png' },
  { title: 'Accessories', href: '/shop?category=accessories', image: '/images/Edited picture for kaldoni/Jacket/adire-jacket-maroon-beaded-front.jpg.png' },
]

const reviewcards = [
  {
    title: 'Mrs. Ifeoma Okonkwo',
    text: '"Beautifully crafted garments that celebrate our heritage. A must-have for every wardrobe!"',
  },
  {
    title: 'Mr. Hebert Johnson',
    text: '"I am thoroughly impressed with the quality and attention to detail. Truly a remarkable experience!"',
  },
  {
    title: 'Dr. Vido F',
    text: '"The craftsmanship is exceptional, and the designs are timeless. I highly recommend this brand!"',
  },
  {
    title: 'Kalio Max',
    text: '"Light, comfortable, and full of colour. The kind of outfit I would reach for on a relaxed weekend."',
  },
  {
    title: 'Ahmed Usman',
    text: '"A lovely way to stand out at a celebration. The Adire patterns bring so much personality to the look."',
  },
  {
    title: 'Taiwo Ola',
    text: '"I love seeing traditional patterns in styles that feel fresh and easy to wear. A beautiful celebration of our culture."',
  },
  {
    title: 'Ugochi Okafor',
    text: '"A colourful Adire piece would make such a thoughtful gift for someone who loves expressive, individual style."',
  },
  {
    title: 'Francis Jude',
    text: '"I can picture this with sandals for a casual afternoon or dressed up for dinner. So many ways to make the look my own."',
  },
]
const FAQs = [
 {
          q: 'What is Adire fabric?',
          a: 'Adire is a traditional West African textile, particularly from Nigeria, created using a resist-dyeing technique with indigo dye. The patterns are created by folding, binding, stitching, or stenciling the fabric before dyeing, resulting in unique, intricate patterns. Each piece is handcrafted by master artisans.',
        },
        {
          q: 'What sizes do you offer for fabric?',
          a: 'We offer fabrics in various lengths: 2 yards, 3 yards, 5 yards, and custom lengths upon request. Our menswear collection comes in standard sizes XS to XXL.',
        },
        {
          q: 'How do I place an order?',
          a: 'Simply browse our shop, select your desired items, add them to your cart, and proceed to checkout. You can create an account or check out as a guest.',
        },
        {
          q: 'What payment methods do you accept?',
          a: 'We accept all major credit cards (Visa, Mastercard, American Express), bank transfers, and digital payment platforms like PayPal and Stripe.',
        },
        {
          q: 'Do you ship internationally?',
          a: 'Yes! We ship to most countries worldwide. Shipping costs and times vary by location. Check our shipping calculator at checkout for precise details.',
        },
]

export default function Home() {
  return (
    <div className="bg-[#0d0d0d] text-white">
      <section className="relative min-h-[820px] overflow-hidden bg-black">
        {/* Hero slideshow */}
        <HeroSlideshow />

        <div className="relative mx-auto max-w-[1280px] px-6 pb-16 pt-12 md:px-12 lg:px-16">
          <div className="pt-20 md:pt-28 lg:pt-32">
            <div className="max-w-[720px]">
              <p className="mb-5 text-sm uppercase tracking-[0.2em] text-[#e4c158]">{brand.slogan}</p>
              <h1 className="font-[var(--font-heading)] text-5xl leading-[0.95] tracking-[-0.04em] text-white md:text-7xl">
                Promoting Culture
                <br />
                Preserving Heritage
              </h1>

              <p className="mt-8 max-w-[540px] text-base font-medium text-[#f3f3f4] md:text-lg">
                {brand.mission}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/shop">
                  <button className="rounded-[4px] bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.55px] text-black transition hover:bg-[#e4c158] hover:text-black">
                    Shop Now
                  </button>
                </Link>
                <Link href="/shop">
                  <button className="rounded-[4px] border border-white bg-transparent px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.55px] text-white transition hover:bg-white/10">
                    New Arrivals
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

<section className="bg-[#0d0d0d] px-6 py-16 md:px-12 lg:px-16">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-8 flex items-center gap-4">
            <span className="text-[14px] font-normal uppercase tracking-[0.2em] text-white">
              Essentials
            </span>
            <div className="h-px flex-1 bg-[#c4c7c7]/60" />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
            {categoryCards.map((card) => (
              <Link href={card.href} key={card.title} className="group">
                <div className="overflow-hidden rounded-[12px] bg-[#0d0d0d] border border-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                  <figure className="m-0 flex flex-col items-stretch">
                    <img src={card.image} alt={card.title} className="w-full h-auto max-h-[320px] object-contain" />
                    <figcaption className="mt-3 text-center text-[13px] font-semibold text-[#e4c158] py-2">{card.title}</figcaption>
                  </figure>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <HomePromotion />

      <section className="bg-[#0d0d0d] px-6 py-10 md:px-12 lg:px-16">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-8 flex items-center gap-4">
            <span className="text-[14px] font-normal uppercase tracking-[0.2em] text-white">
              Reviews
            </span>
            <div className="h-px flex-1 bg-[#c4c7c7]/60" />
          </div>

          <ReviewSlider reviews={reviewcards} />
        </div>
      </section>

      <section className="bg-[#0d0d0d] px-6 py-10 md:px-12 lg:px-16">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-8 flex items-center gap-4">
            <span className="text-[14px] font-normal uppercase tracking-[0.2em] text-white">
              FAQs
            </span>
            <div className="h-px flex-1 bg-[#c4c7c7]/60" />
          </div>

          <div className="mx-auto max-w-3xl space-y-3">
            {FAQs.map((card) => (
              <details name="home-faq" key={card.q} className="group rounded-lg border border-zinc-800 bg-black open:border-[#e4c158]/50">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                  {card.q}
                  <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 text-[#e4c158] transition-transform group-open:rotate-180 motion-reduce:transition-none" />
                </summary>
                <p className="px-5 pb-5 text-sm leading-7 text-zinc-400">{card.a}</p>
              </details>
            ))}
          </div>
          <Link href="/faq" className="mt-7 inline-flex min-h-11 items-center rounded bg-[#e4c158] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-black hover:bg-[#f0d37c]">More FAQs</Link>
        </div>
      </section>

      <section className="bg-black px-6 py-20 text-center md:px-12 lg:px-16">
        <div className="mx-auto max-w-[900px]">
          <div className="mx-auto mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-[#e4c158]/20 text-3xl font-bold text-[#e4c158]">
            “
          </div>
          <p className="font-[var(--font-heading)] text-2xl leading-[1.5] text-white md:text-[32px]">
            {brand.mission}
          </p>
          <Link href="/about" className="mt-6 inline-block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e4c158]">
            Discover Our Heritage
          </Link>
        </div>
      </section>
    </div>
  )
}

function HeroSlideshow() {
  const slides = [
    '/images/Edited picture for kaldoni/Home_slideshow/adire-teems-2-piece-beige-face-men.jpg.png',
    '/images/Edited picture for kaldoni/Home_slideshow/adire-teems-2-piece-green-yellow-men.jpg.png',
    '/images/Edited picture for kaldoni/Home_slideshow/adire-teems-chiffon-bubu-blue.png',
    '/images/Edited picture for kaldoni/Home_slideshow/adire-teems-chiffon-bubu-multicolour-pink.png',
    '/images/Edited picture for kaldoni/Home_slideshow/adire-teems-chiffon-bubu-red-yellow.png',
    '/images/Edited picture for kaldoni/Home_slideshow/adire-teems-kids-adire-dress-green.png',
    '/images/Edited picture for kaldoni/Home_slideshow/adire-teems-tshirt-blue.png',
    '/images/Edited picture for kaldoni/Home_slideshow/adire-teems-tshirt-green.png',
    '/images/Edited picture for kaldoni/Home_slideshow/damask-aso-oke-kimono-pink.png',
    '/images/Edited picture for kaldoni/Home_slideshow/kids-adire-dress-blue-stripe.png',
  ]

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4000)
    return () => clearInterval(t)
  }, [paused])

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0">
        {slides.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`slide-${i}`}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0'}`}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-black/35 pointer-events-none" />
    </div>
  )
}
