'use client'
import Image from 'next/image'
import { useRef, useState } from 'react'
import { maxImageBytes, maxProductImages, productImagePath, type ProductImage } from '@/lib/product-images'

export function ProductImagesEditor({ images, onChange, busy, onBusyChange, name }: {
  images: ProductImage[]; onChange: (images: ProductImage[]) => void
  busy: boolean; onBusyChange: (busy: boolean) => void; name: string
}) {
  const [notice, setNotice] = useState(''), [error, setError] = useState(''), [url, setUrl] = useState('')
  const uploading = useRef(false)
  async function upload(files: File[]) {
    if (!files.length || uploading.current || busy) return
    setNotice(''); setError('')
    if (images.length + files.length > maxProductImages) { setError(`A product can have up to ${maxProductImages} photos. Choose fewer files.`); return }
    if (files.some(file => !file.size || file.size > maxImageBytes)) { setError('Each image must be a PNG, JPEG or WebP file up to 5 MB.'); return }
    uploading.current = true; onBusyChange(true)
    const added: ProductImage[] = [], failures: string[] = []
    try {
      for (const [index, file] of files.entries()) {
        setNotice(`Uploading photo ${index + 1} of ${files.length}...`)
        try {
          const body = new FormData(); body.set('image', file)
          const response = await fetch('/api/admin/images', { method: 'POST', body })
          const result = await response.json()
          if (!response.ok) throw Error(result.error || 'Upload failed.')
          productImagePath(result.url)
          added.push({ url: result.url, alt: name.trim() })
        } catch (failure) { failures.push(`${file.name}: ${failure instanceof Error ? failure.message : 'Upload failed.'}`) }
      }
      if (added.length) onChange([...images, ...added])
      setNotice(`${added.length} photo${added.length === 1 ? '' : 's'} uploaded. Save the product to keep your changes.`)
      setError(failures.join(' '))
    } finally { uploading.current = false; onBusyChange(false) }
  }
  function move(index: number, destination: number) {
    const next = [...images], [image] = next.splice(index, 1)
    next.splice(destination, 0, image); onChange(next)
  }
  function addUrl() {
    try {
      setError('')
      if (images.length >= maxProductImages) throw Error(`A product can have up to ${maxProductImages} photos.`)
      const path = productImagePath(url)
      if (images.some(image => productImagePath(image.url) === path)) throw Error('This photo is already in the gallery.')
      onChange([...images, { url: url.trim(), alt: name.trim() }]); setUrl('')
      setNotice('Photo added. Save the product to keep your changes.')
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Enter a valid image URL.') }
  }
  return <fieldset disabled={busy} className="space-y-4 border border-zinc-300 p-4 md:col-span-2">
    <legend className="px-2 font-semibold">Product photos ({images.length}/{maxProductImages})</legend>
    <p className="text-sm text-zinc-600">The first photo is the cover shown in the shop. Upload several files at once, then arrange the gallery. PNG, JPEG or WebP, up to 5 MB each.</p>
    <label className="block">Upload photos<input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={async event => { const files = Array.from(event.currentTarget.files || []); event.currentTarget.value = ''; await upload(files) }} /></label>
    <div className="flex flex-wrap items-end gap-3"><label className="min-w-0 flex-1">Image URL or local path<input value={url} maxLength={2000} onChange={event => setUrl(event.target.value)} placeholder="https://... or /images/..." /></label><button type="button" onClick={addUrl} disabled={!url.trim() || busy} className="border px-4 py-2">Add photo</button></div>
    <p role="status" aria-live="polite" className="text-sm">{notice}</p>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {!images.length && <p className="text-sm text-zinc-600">Add at least one product photo before saving.</p>}
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((image, index) => <li key={image.url} className="space-y-3 border border-zinc-200 p-3">
        <Image src={image.url} alt={image.alt || name || `Product photo ${index + 1}`} width={240} height={300} unoptimized className="aspect-[4/5] w-full object-cover" />
        <p className="text-sm font-semibold">{index === 0 ? 'Cover photo' : `Photo ${index + 1}`}</p>
        <label className="block text-sm">Image description<input value={image.alt} maxLength={300} onChange={event => onChange(images.map((item, position) => position === index ? { ...item, alt: event.target.value } : item))} /></label>
        <div className="flex flex-wrap gap-3 text-sm">
          {index > 0 && <button type="button" className="underline" onClick={() => move(index, 0)}>Make cover</button>}
          <button type="button" className="underline disabled:opacity-40" disabled={index === 0 || busy} aria-label={`Move photo ${index + 1} earlier`} onClick={() => move(index, index - 1)}>Move earlier</button>
          <button type="button" className="underline disabled:opacity-40" disabled={index === images.length - 1 || busy} aria-label={`Move photo ${index + 1} later`} onClick={() => move(index, index + 1)}>Move later</button>
          <button type="button" className="text-red-700 underline" aria-label={`Remove photo ${index + 1}`} onClick={() => onChange(images.filter((_, position) => position !== index))}>Remove</button>
        </div>
      </li>)}
    </ol>
  </fieldset>
}
