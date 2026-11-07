export const articlePrefix = 'ADIRE_ARTICLE_V1\n'
export type ArticleBlock = { id: string; type: 'paragraph' | 'heading' | 'quote' | 'list' | 'image'; text: string; align: 'left' | 'center' | 'right' | 'full'; src: string; alt: string; caption: string; width: number }
export type Article = { columns: 1 | 2; blocks: ArticleBlock[] }
export function imageSource(value: string) {
  if (/^\/(?!\/)/.test(value) && !/[\\\u0000-\u0020]/.test(value)) return value
  try { const url = new URL(value); if (url.protocol === 'https:' && !url.username && !url.password) return url.href } catch {}
  throw Error('Use a local image path or an HTTPS image URL.')
}
export function parseArticle(content: string): Article {
  if (!content.startsWith(articlePrefix)) return { columns: 1, blocks: content.split(/\n\s*\n/).filter(Boolean).map((text, index) => ({ id: `legacy-${index}`, type: 'paragraph', text, align: 'left', src: '', alt: '', caption: '', width: 50 })) }
  const value = JSON.parse(content.slice(articlePrefix.length))
  if (!value || ![1, 2].includes(value.columns) || !Array.isArray(value.blocks) || value.blocks.length > 200) throw Error('Invalid article layout.')
  const ids = new Set<string>()
  const blocks = value.blocks.map((block: ArticleBlock) => {
    if (!block || typeof block.id !== 'string' || !/^[\w-]{1,100}$/.test(block.id) || ids.has(block.id) || !['paragraph', 'heading', 'quote', 'list', 'image'].includes(block.type) || !['left', 'center', 'right', 'full'].includes(block.align) || ![25, 50, 75, 100].includes(block.width)) throw Error('Invalid article block.')
    ids.add(block.id)
    for (const field of ['text', 'src', 'alt', 'caption'] as const) if (typeof block[field] !== 'string' || block[field].length > (field === 'text' ? 20000 : 2000)) throw Error('Article block is too long.')
    return { id: block.id, type: block.type, text: block.text, align: block.align, src: block.type === 'image' ? imageSource(block.src) : '', alt: block.alt, caption: block.caption, width: block.width }
  })
  return { columns: value.columns, blocks }
}
export function serializeArticle(article: Article) { return articlePrefix + JSON.stringify(article) }
export function validateArticle(content: string) {
  if (content.startsWith(articlePrefix)) return serializeArticle(parseArticle(content))
  return content
}
export function articleImagePaths(content: string) {
  try { return parseArticle(content).blocks.filter(block => block.type === 'image').map(block => {
    if (!block.src.startsWith('/api/media?')) return null
    return new URL(block.src, 'https://adireteems.com').searchParams.get('path')
  }).filter(Boolean) } catch { return [] }
}
