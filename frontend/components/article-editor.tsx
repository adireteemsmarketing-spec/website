'use client'
import { useRef, useState } from 'react'
import { ArticleContent } from './article-content'
import { parseArticle, serializeArticle, type ArticleBlock, type Article } from '@/lib/article'

export function ArticleEditor({ value, onChange, busy, onBusyChange }: { value: string; onChange: (value: string) => void; busy: boolean; onBusyChange: (busy: boolean) => void }) {
  const [preview, setPreview] = useState(false), [error, setError] = useState(''), [dragged, setDragged] = useState<string | null>(null)
  const fields = useRef<Record<string, HTMLTextAreaElement | null>>({})
  let article: Article
  try { article = parseArticle(value) } catch { return <p role="alert">Unable to open this article layout. Please reload before editing.</p> }
  function commit(next: Article) { onChange(serializeArticle(next)) }
  function update(id: string, changes: Partial<ArticleBlock>) { commit({ ...article, blocks: article.blocks.map(block => block.id === id ? { ...block, ...changes } : block) }) }
  function add(type: ArticleBlock['type'], after?: number, src = '') {
    const blocks = [...article.blocks]
    blocks.splice(after === undefined ? blocks.length : after + 1, 0, { id: crypto.randomUUID(), type, text: '', align: type === 'image' ? 'center' : 'left', src, alt: '', caption: '', width: type === 'image' ? 75 : 50 })
    commit({ ...article, blocks })
  }
  function move(id: string, target: number, align?: ArticleBlock['align']) {
    const blocks = [...article.blocks], index = blocks.findIndex(block => block.id === id)
    if (index < 0) return
    const [block] = blocks.splice(index, 1)
    blocks.splice(Math.max(0, Math.min(target, blocks.length)), 0, align ? { ...block, align } : block)
    commit({ ...article, blocks })
  }
  function split(block: ArticleBlock, index: number) {
    const position = fields.current[block.id]?.selectionStart ?? block.text.length
    const blocks = [...article.blocks]
    blocks.splice(index, 1, { ...block, text: block.text.slice(0, position) }, { ...block, id: crypto.randomUUID(), text: block.text.slice(position) })
    commit({ ...article, blocks })
  }
  async function upload(file: File, after?: number) {
    onBusyChange(true); setError('')
    try {
      const body = new FormData(); body.set('image', file)
      const response = await fetch('/api/admin/images', { method: 'POST', body }), result = await response.json()
      if (!response.ok) throw Error(result.error)
      add('image', after, result.url)
    } catch (error) { setError((error as Error).message) } finally { onBusyChange(false) }
  }
  function format(block: ArticleBlock, marker: string) {
    const field = fields.current[block.id]
    if (!field) return
    const start = field.selectionStart, end = field.selectionEnd
    update(block.id, { text: block.text.slice(0, start) + marker + (block.text.slice(start, end) || 'text') + marker + block.text.slice(end) })
  }
  return <section className="md:col-span-2 space-y-4"><div className="flex flex-wrap items-center gap-4"><h2 className="font-heading text-2xl">Article layout</h2><label>Columns<select value={article.columns} disabled={busy} onChange={event => commit({ ...article, columns: Number(event.target.value) as 1 | 2 })}><option value={1}>One column</option><option value={2}>Two columns</option></select></label><button type="button" className="underline" onClick={() => setPreview(!preview)}>{preview ? 'Back to editing' : 'Preview article'}</button></div><p className="text-sm text-zinc-600">Add paragraphs, headings, quotes and images in any order. Drag a block by its handle to move it. Drop an image on the left or right zone to wrap text around it. On phones, images stack above the text.</p>{error && <p role="alert" className="text-red-700">{error}</p>}{preview ? <div className="border bg-black p-6 text-zinc-300"><ArticleContent content={value} /></div> : <div className="space-y-4">{article.blocks.map((block, index) => <section key={block.id} className="rounded border border-zinc-300 bg-zinc-50 p-4" onDragOver={event => { if (dragged) event.preventDefault() }} onDrop={event => { if (!dragged || busy) return; event.preventDefault(); event.stopPropagation(); move(dragged, index); setDragged(null) }}><div className="mb-3 flex flex-wrap items-center gap-4"><button type="button" draggable={!busy} onDragStart={event => { event.dataTransfer.setData('text/plain', block.id); event.dataTransfer.effectAllowed = 'move'; setDragged(block.id) }} onDragEnd={() => setDragged(null)} aria-label={`Drag ${block.type} ${index + 1}`} className="cursor-grab border px-3 py-1">↕ {block.type}</button><button type="button" disabled={busy || index === 0} onClick={() => move(block.id, index - 1)}>Move up</button><button type="button" disabled={busy || index === article.blocks.length - 1} onClick={() => move(block.id, index + 1)}>Move down</button><button type="button" disabled={busy} className="text-red-700 underline" onClick={() => commit({ ...article, blocks: article.blocks.filter(item => item.id !== block.id) })}>Remove</button></div>{block.type === 'image' ? <><img src={block.src} alt={block.alt} className="mb-3 max-h-64 max-w-full object-contain" /><div className="grid gap-3 sm:grid-cols-2"><label>Image description<input value={block.alt} maxLength={2000} onChange={event => update(block.id, { alt: event.target.value })} /></label><label>Caption<input value={block.caption} maxLength={2000} onChange={event => update(block.id, { caption: event.target.value })} /></label><label>Image width<select value={block.width} onChange={event => update(block.id, { width: Number(event.target.value) })}>{[25, 50, 75, 100].map(width => <option key={width} value={width}>{width}%</option>)}</select></label></div></> : <><div className="mb-2 flex gap-4"><button type="button" onClick={() => format(block, '**')} className="font-bold">Bold</button><button type="button" onClick={() => format(block, '_')} className="italic">Italic</button><button type="button" className="underline" onClick={() => split(block, index)}>Split at cursor</button></div><label className="block">{block.type === 'list' ? 'List items (one per line)' : `${block.type} text`}<textarea ref={element => { fields.current[block.id] = element }} value={block.text} rows={block.type === 'heading' ? 2 : 5} maxLength={20000} onChange={event => update(block.id, { text: event.target.value })} /></label></>}<label className="mt-3 block">{block.type === 'image' ? 'Placement' : 'Text alignment'}<select value={block.align} onChange={event => update(block.id, { align: event.target.value as ArticleBlock['align'] })}><option value="left">Left{block.type === 'image' ? ' — wrap text' : ''}</option><option value="center">Center</option><option value="right">Right{block.type === 'image' ? ' — wrap text' : ''}</option><option value="full">{block.type === 'image' ? 'Full width' : 'Justified'}</option></select></label>{dragged && article.blocks.find(item => item.id === dragged)?.type === 'image' && <div className="mt-3 grid grid-cols-2 gap-3">{(['left', 'right'] as const).map(side => <div key={side} className="border-2 border-dashed p-5 text-center" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); event.stopPropagation(); move(dragged, index, side); setDragged(null) }}>Place image {side}</div>)}</div>}<div className="mt-4 flex flex-wrap gap-3"><button type="button" className="underline" disabled={busy} onClick={() => add('paragraph', index)}>Add paragraph below</button><label className="cursor-pointer underline">Insert image below<input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file, index); event.target.value = '' }} /></label></div></section>)}</div>}<div className="flex flex-wrap gap-3">{(['paragraph', 'heading', 'quote', 'list'] as const).map(type => <button type="button" key={type} disabled={busy} className="border px-3 py-2 capitalize" onClick={() => { setPreview(false); add(type) }}>Add {type}</button>)}<label className="cursor-pointer border px-3 py-2">{busy ? 'Uploading…' : 'Add image'}<input type="file" className="sr-only" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={event => { const file = event.target.files?.[0]; if (file) { setPreview(false); void upload(file) } event.target.value = '' }} /></label></div></section>
}
