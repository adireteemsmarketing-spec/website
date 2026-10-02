'use client'
import { useEffect, useState } from 'react'
import { emptyPromotion, type Promotion } from '@/lib/promotion'

export function PromotionEditor() {
  const [form, setForm] = useState<Promotion>(emptyPromotion)
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('')
  useEffect(() => {
    let active = true
    fetch('/api/admin/promotion', { cache: 'no-store' }).then(async r => { const data = await r.json(); if (!r.ok) throw Error(data.error); if (active) { setForm(data); setLoading(false) } }).catch(e => { if (active) setError(e.message) })
    return () => { active = false }
  }, [])
  async function upload(file: File) {
    setBusy(true); setError(''); setNotice('')
    try { const body = new FormData(); body.set('image', file); const r = await fetch('/api/admin/images', { method: 'POST', body }); const data = await r.json(); if (!r.ok) throw Error(data.error); setForm(current => ({ ...current, image: data.url })); setNotice('Image uploaded. Save the promotion to use it.') }
    catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try { const r = await fetch('/api/admin/promotion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); const data = await r.json(); if (!r.ok) throw Error(data.error); setForm(data); setNotice(data.published ? 'Promotion published on the homepage.' : 'Draft saved. The promotion is hidden from the homepage.'); window.dispatchEvent(new Event('adire-store-changed')) }
    catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  if (loading) return <p role={error ? 'alert' : 'status'}>{error || 'Loading homepage promotion…'}{error && <button className="ml-3 underline" onClick={() => window.location.reload()}>Reload</button>}</p>
  return <form onSubmit={save} className="max-w-3xl space-y-5 border bg-white p-6">
    <p>Use this space for a promotion, collection launch, or announcement. Publish it when ready, or save it as a draft to hide it.</p>
    <fieldset disabled={busy} className="space-y-5">
      <label className="block">Heading<input required={form.published} maxLength={150} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
      <label className="block">Message<textarea rows={5} maxLength={2000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
      <fieldset className="space-y-4 rounded-lg border border-zinc-300 p-4">
        <legend className="px-2 font-semibold">Promotion image (optional)</legend>
        <label className="block" htmlFor="promotion-image">Upload image</label>
        <input id="promotion-image" type="file" accept="image/png,image/jpeg,image/webp" aria-describedby="promotion-image-help" onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void upload(file) }} />
        <p id="promotion-image-help" className="text-sm text-zinc-600">Choose a PNG, JPEG or WebP image up to 5 MB. It will appear beside your promotion on the homepage after saving.</p>
        <label className="block">Or paste an image link<input placeholder="https://example.com/promotion.jpg" maxLength={2000} value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} /></label>
        {form.image && <div className="space-y-3"><img src={form.image} alt="Promotion preview" className="max-h-56 w-full rounded object-contain" /><button type="button" className="text-sm underline" onClick={() => { setForm(current => ({ ...current, image: '' })); setNotice('Image removed. Save the promotion to apply this change.') }}>Remove image</button></div>}
      </fieldset>
      <label className="block">Button text (optional)<input maxLength={80} value={form.linkLabel} onChange={e => setForm({ ...form, linkLabel: e.target.value })} /></label>
      <label className="block">Button link<input placeholder="/shop" maxLength={2000} value={form.linkUrl} onChange={e => setForm({ ...form, linkUrl: e.target.value })} /></label>
      <label className="flex items-center gap-3"><input type="checkbox" className="!w-5" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} />Show on homepage</label>
      <button className="store-primary">{busy ? 'Saving…' : 'Save promotion'}</button>
    </fieldset>
    {error && <p role="alert" className="text-red-700">{error}</p>}<p role="status">{notice}</p>
  </form>
}
