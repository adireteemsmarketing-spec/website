'use client'
import { useCallback, useEffect, useState } from 'react'
import { useCustomer } from './customer-provider'
import { CustomerSignIn } from './customer-sign-in'
import type { Customer } from '@/lib/customer-types'

type Review = { id: string; title: string | null; body: string; rating: number; status: string }
export function CustomerReviews() {
  const { customer, loaded } = useCustomer()
  if (!loaded) return <p>Loading your account…</p>
  if (!customer) return <><p>Sign in to share a product review.</p><CustomerSignIn /></>
  return <CustomerReviewForm key={customer.id} customer={customer} />
}
function CustomerReviewForm({ customer }: { customer: Customer }) {
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]), [reviews, setReviews] = useState<Review[]>([]), [ready, setReady] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/customer/reviews', { cache: 'no-store' }), data = await response.json()
      if (!response.ok) throw Error(data.error)
      setProducts(data.products); setReviews(data.reviews); setError(''); setReady(true)
    } catch (error) { setError((error as Error).message) }
  }, [])
  // Fetch external review data; state updates occur after the response arrives.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load() }, [load])
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget, fields = Object.fromEntries(new FormData(form)); setBusy(true); setNotice(''); setError('')
    try {
      const response = await fetch('/api/customer/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...fields, rating: Number(fields.rating) }) }), data = await response.json()
      if (!response.ok) throw Error(data.error)
      form.reset(); await load(); setNotice('Thank you! Your review has been sent to our team and will appear publicly once approved.')
    } catch (error) { setError((error as Error).message) } finally { setBusy(false) }
  }
  return <section className="space-y-5">{error && <p role="alert">{error} <button className="underline" onClick={() => void load()}>Retry loading</button></p>}<p role="status">{notice}</p>{!ready ? !error && <p>Loading reviews…</p> : <>{products.length ? <form onSubmit={submit} className="grid max-w-2xl gap-4 rounded border border-zinc-300 bg-white p-6 text-zinc-900"><label>Product<select className="mt-2 block w-full border p-3" name="productId" required defaultValue=""><option value="" disabled>Choose a product</option>{products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label>Rating<select className="mt-2 block w-full border p-3" name="rating" defaultValue="5">{[5, 4, 3, 2, 1].map(rating => <option key={rating} value={rating}>{rating} out of 5 stars</option>)}</select></label><label>Public display name<input className="mt-2 block w-full border p-3" name="displayName" maxLength={100} defaultValue={customer.name} required /></label><label>Title (optional)<input className="mt-2 block w-full border p-3" name="title" maxLength={150} /></label><label>Your review<textarea className="mt-2 block w-full border p-3" name="body" maxLength={3000} rows={4} required /></label><p className="text-sm">Your name and review will be public after approval. Please leave out phone numbers, addresses and payment details.</p><button disabled={busy} className="bg-black px-5 py-3 text-white disabled:opacity-50">{busy ? 'Submitting…' : 'Submit review'}</button></form> : <p>No products are available for reviews yet.</p>}{reviews.length > 0 && <section className="space-y-4"><h3 className="font-heading text-2xl">Your submitted reviews</h3>{reviews.map(review => <article key={review.id} className="rounded border p-5"><p className="text-sm">{review.rating}/5 stars · {review.status === 'pending' ? 'Awaiting approval' : review.status === 'approved' ? 'Published' : 'Not published'}</p>{review.title && <h4 className="mt-2 font-semibold">{review.title}</h4>}<p className="mt-2 whitespace-pre-wrap break-words">{review.body}</p></article>)}</section>}</>}</section>
}
