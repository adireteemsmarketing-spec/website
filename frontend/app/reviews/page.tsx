import type { Metadata } from 'next'
import Link from 'next/link'
import { createPublicClient } from '@/lib/supabase/public'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Customer Reviews | Adire Teems',
  description: 'Read customer feedback published by Adire Teems and share your experience with our team.',
}

export default async function ReviewsPage() {
  const result = await readReviews()
  return <section className="store-shell max-w-5xl">
    <header className="mb-10 max-w-2xl"><p className="store-eyebrow">Your experience matters</p><h1 className="mt-3 font-heading text-4xl sm:text-5xl">Customer reviews</h1><p className="mt-5 leading-7 text-zinc-400">Feedback helps us understand your experience with our pieces and service. Read published customer reviews below, or tell our team about your order.</p></header>
    {result.error ? <p role="status" className="store-panel">Reviews are unavailable right now. Please try again later or contact our team.</p> : result.reviews.length ? <div className="grid gap-5 md:grid-cols-2">{result.reviews.map(review => <article key={review.id} className="store-panel">
      <p className="text-sm text-[#e4c158]" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
      {review.title && <h2 className="mt-4 font-heading text-2xl">{review.title}</h2>}
      <p className="my-4 whitespace-pre-wrap leading-7 text-zinc-300">{review.body}</p><p className="text-sm text-zinc-400">{review.display_name}</p>
    </article>)}</div> : <div className="store-panel"><h2 className="font-heading text-2xl">Share your experience</h2><p className="mt-3 leading-7 text-zinc-400">There are no published reviews to display yet. If you have purchased from Adire Teems, we would love to hear your feedback.</p></div>}
    <section className="mt-10 border-t border-zinc-700 pt-8"><h2 className="font-heading text-2xl">Tell us about your order</h2><p className="my-4 text-zinc-400">Use our contact form to share feedback or ask for help. Include your order number so our team can follow up. Feedback sent through the form is received privately.</p><Link href="/contact" className="store-primary inline-block">Share feedback</Link><Link href="/shop" className="ml-5 underline">Explore the shop</Link></section>
  </section>
}

async function readReviews() {
  try {
    const {data,error}=await createPublicClient().from('reviews').select('id,rating,title,body,display_name').eq('status','approved').order('created_at',{ascending:false}).limit(30)
    if(error)throw error
    return { reviews:data||[], error:false }
  } catch { return { reviews:[], error:true } }
}
