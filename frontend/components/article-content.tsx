import { Fragment } from 'react'
import { parseArticle } from '@/lib/article'

// Render a small formatting vocabulary as React nodes, never arbitrary HTML.
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).map((part, index) => part.startsWith('**') && part.endsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : part.startsWith('_') && part.endsWith('_') ? <em key={index}>{part.slice(1, -1)}</em> : <Fragment key={index}>{part}</Fragment>)
}
export function ArticleContent({ content }: { content: string }) {
  let article
  try { article = parseArticle(content) } catch { return <p role="status">This article is temporarily unavailable.</p> }
  return <div className={`article-content ${article.columns === 2 ? 'article-columns' : ''}`}>{article.blocks.map(block => {
    if (block.type === 'image') return <figure key={block.id} className={`article-image article-image-${block.align}`} style={{ '--image-width': `${block.width}%` } as React.CSSProperties}><img src={block.src} alt={block.alt} /><figcaption>{block.caption}</figcaption></figure>
    const style = { textAlign: block.align === 'full' ? 'justify' as const : block.align }
    if (block.type === 'heading') return <h2 key={block.id} style={style}>{inline(block.text)}</h2>
    if (block.type === 'quote') return <blockquote key={block.id} style={style}>{inline(block.text)}</blockquote>
    if (block.type === 'list') return <ul key={block.id} style={style}>{block.text.split('\n').filter(Boolean).map((item, index) => <li key={index}>{inline(item)}</li>)}</ul>
    return <p key={block.id} style={style}>{inline(block.text)}</p>
  })}</div>
}
