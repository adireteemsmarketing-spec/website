'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'

export default function ReviewSlider({ reviews }: { reviews: { title: string; text: string }[] }) {
  const track = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || reviews.length < 2) return
    const timer = window.setInterval(() => {
      const element = track.current
      if (!element || !element.clientWidth || document.hidden) return
      const current = Math.round(element.scrollLeft / element.clientWidth)
      element.scrollTo({ left: ((current + 1) % reviews.length) * element.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    }, 6000)
    return () => window.clearInterval(timer)
  }, [paused, reviews.length, active])

  function goTo(index: number) {
    const element = track.current
    if (!element) return
    element.scrollTo({ left: index * element.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }

  return (
    <div role="region" aria-roledescription="carousel" aria-label="Customer reviews" className="mx-auto max-w-3xl min-w-0">
      <div
        ref={track}
        id="customer-reviews"
        tabIndex={0}
        aria-label="Swipe or use the arrow keys to browse reviews"
        onKeyDown={event => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault()
            goTo(Math.max(0, Math.min(reviews.length - 1, active + (event.key === 'ArrowRight' ? 1 : -1))))
          }
        }}
        onScroll={event => setActive(Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth))}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-xl focus-visible:outline-2 focus-visible:outline-[#e4c158] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {reviews.map((review, index) => (
          <figure key={review.title} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${reviews.length}`} className="m-0 flex w-full shrink-0 snap-center flex-col justify-center border border-zinc-800 bg-black px-6 py-10 text-center sm:px-12">
            <blockquote className="text-base leading-8 text-[#e4c158] sm:text-xl">{review.text}</blockquote>
            <figcaption className="mt-6 text-sm text-white">{review.title}</figcaption>
          </figure>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-center gap-5">
        <button type="button" aria-label="Previous review" aria-controls="customer-reviews" disabled={active === 0} onClick={() => goTo(active - 1)} className="grid h-11 w-11 place-items-center rounded-full border border-zinc-600 text-[#e4c158] hover:border-[#e4c158] disabled:opacity-30"><ChevronLeft aria-hidden="true" className="h-5 w-5" /></button>
        <span aria-live={paused ? 'polite' : 'off'} aria-atomic="true" className="text-sm text-zinc-400">{active + 1} / {reviews.length}</span>
        <button type="button" aria-label="Next review" aria-controls="customer-reviews" disabled={active === reviews.length - 1} onClick={() => goTo(active + 1)} className="grid h-11 w-11 place-items-center rounded-full border border-zinc-600 text-[#e4c158] hover:border-[#e4c158] disabled:opacity-30"><ChevronRight aria-hidden="true" className="h-5 w-5" /></button>
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Play review slideshow' : 'Pause review slideshow'} className="inline-flex min-h-11 items-center gap-2 rounded px-3 text-xs text-zinc-400 hover:text-[#e4c158]">
          {paused ? <Play aria-hidden="true" className="h-4 w-4" /> : <Pause aria-hidden="true" className="h-4 w-4" />}
          {paused ? 'Play slideshow' : 'Pause slideshow'}
        </button>
      </div>
    </div>
  )
}
