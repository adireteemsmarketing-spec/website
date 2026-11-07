const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const { renderToStaticMarkup } = require('react-dom/server')
const React = require('react')
function load(file, mocks = {}) {
  const module = { exports: {} }
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
  new Function('module', 'exports', 'require', code)(module, module.exports, name => name in mocks ? mocks[name] : require(name))
  return module.exports
}
const article = load('lib/article.ts')
const text = { id: 'one', type: 'paragraph', text: 'A **bold** and _italic_ story.', align: 'left', src: '', alt: '', caption: '', width: 50 }
const image = { ...text, id: 'two', type: 'image', src: '/api/media?path=draft-media%2Fimage.jpg', alt: 'Fabric', caption: 'Hand dyed cloth', align: 'right', width: 50 }
const encode = blocks => article.serializeArticle({ columns: 2, blocks })
test('legacy articles preserve paragraphs and remain editable', () => {
  const parsed = article.parseArticle('First paragraph.\n\nSecond paragraph.')
  assert.equal(parsed.columns, 1)
  assert.deepEqual(parsed.blocks.map(block => block.text), ['First paragraph.', 'Second paragraph.'])
})
test('structured article roundtrips layout, image placement, captions and order', () => {
  const content = encode([image, text])
  assert.deepEqual(article.parseArticle(article.validateArticle(content)), { columns: 2, blocks: [image, text] })
  assert.deepEqual(article.articleImagePaths(content), ['draft-media/image.jpg'])
})
test('article validation rejects executable images, invalid layout and duplicate blocks', () => {
  for (const src of ['javascript:alert(1)', 'data:image/svg+xml,test', '//evil.example/image', '/\\evil.example/image']) assert.throws(() => article.validateArticle(encode([{ ...image, src }])))
  assert.throws(() => article.validateArticle(encode([text, text])))
  assert.throws(() => article.validateArticle(encode([{ ...image, width: 10000 }])))
  assert.throws(() => article.validateArticle(article.articlePrefix + '{broken'))
})
test('article renderer displays formatting and image layout without executing article HTML', () => {
  const { ArticleContent } = load('components/article-content.tsx', { '@/lib/article': article })
  const html = renderToStaticMarkup(React.createElement(ArticleContent, { content: encode([image, { ...text, text: text.text + '<script>alert(1)</script>' }]) }))
  assert.match(html, /article-columns/)
  assert.match(html, /article-image-right/)
  assert.match(html, /<strong>bold<\/strong>/)
  assert.match(html, /<em>italic<\/em>/)
  assert.match(html, /Hand dyed cloth/)
  assert.doesNotMatch(html, /<script>/)
})
test('inline media is public only when a visible article references the exact image', async () => {
  for (const published of [true, false]) {
    let downloads = 0
    const query = table => ({ columns: '', select(columns) { this.columns = columns; return this }, eq() { return this }, like() { return this }, async limit() { return { data: table === 'blog_posts' && this.columns === 'content' && published ? [{ content: encode([image]) }] : [], error: null } } })
    const route = load('app/api/media/route.ts', {
      '@/lib/article': article,
      '@/lib/supabase/public': { createPublicClient: () => ({ from: query }) },
      '@/lib/admin-auth': { isAdmin: async () => false },
      '@/lib/supabase/admin': { createAdminClient: () => ({ storage: { from: () => ({ download: async () => { downloads++; return { data: new Blob(['image'], { type: 'image/jpeg' }), error: null } } }) } }) },
    })
    const response = await route.GET(new Request('https://adireteems.com/api/media?path=draft-media%2Fimage.jpg'))
    assert.equal(response.status, published ? 200 : 404)
    assert.equal(downloads, published ? 1 : 0)
  }
})
