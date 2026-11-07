'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

type Review = { id: string; rating: number; title: string | null; body: string; display_name: string; status: string; created_at: string; products: { name: string } | null }
export function AdminReviews({ compact = false }: { compact?: boolean }) {
  const [reviews, setReviews] = useState<Review[] | null>(null), [error, setError] = useState(''), [filter, setFilter] = useState('all'), [busy, setBusy] = useState(false), [notice, setNotice] = useState('')
  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/reviews', { cache: 'no-store' }), data = await response.json()
      if (!response.ok) throw Error(data.error)
      setReviews(data.reviews); setError('')
    } catch (error) { setError((error as Error).message) }
  }, [])
  // Fetch external review data; state updates occur after the response arrives.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load() }, [load])
  async function moderate(id: string, status: string) {
    setBusy(true); setNotice('')
    try {
      const response = await fetch('/api/admin/reviews', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) }), data = await response.json()
      if (!response.ok) throw Error(data.error)
      await load(); setNotice(status === 'approved' ? 'Review published on the reviews page.' : 'Review hidden from the public reviews page.')
    } catch (error) { setError((error as Error).message) } finally { setBusy(false) }
  }
  const filtered = reviews?.filter(review => filter === 'all' || review.status === filter) || []
  return <section><div className="mb-5 flex flex-wrap items-center justify-between gap-4"><p>{reviews?.filter(review => review.status === 'pending').length || 0} awaiting approval</p><button disabled={busy} onClick={() => void load()} className="border px-4 py-2">Refresh reviews</button><Link href="/reviews" className="underline">View public reviews</Link></div>{error && <p role="alert" className="mb-4 text-red-700">{error}</p>}<p role="status">{notice}</p>{!compact && <label className="mb-5 block">Review status<select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All reviews</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label>}{!reviews ? !error && <p>Loading reviews…</p> : !filtered.length ? <p>No reviews to display.</p> : <div className="space-y-4">{(compact ? filtered.slice(0, 5) : filtered).map(review => <article key={review.id} className="border bg-white p-6"><p className="text-sm">{review.rating}/5 stars · {review.status} · {review.created_at.slice(0, 10)}</p><h3 className="mt-3 font-heading text-xl">{review.title || 'Customer review'}</h3><p className="my-3 whitespace-pre-wrap break-words">{review.body}</p><p className="text-sm text-zinc-600">{review.display_name} · {review.products?.name || 'Product unavailable'}</p><div className="mt-4 flex flex-wrap gap-4">{['approved', 'rejected', 'pending'].filter(status => status !== review.status).map(status => <button key={status} disabled={busy} className="underline disabled:opacity-50" onClick={() => void moderate(review.id, status)}>{status === 'approved' ? 'Approve & publish' : status === 'rejected' ? 'Reject' : 'Return to pending'}</button>)}</div></article>)}</div>}</section>
}
