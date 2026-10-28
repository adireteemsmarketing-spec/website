/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS tooling uses the installed frontend packages. */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
function load(file, mocks = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
  const loadedModule = { exports: {} }
  new Function('module', 'exports', 'require', code)(loadedModule, loadedModule.exports, name => name in mocks ? mocks[name] : require(name))
  return loadedModule.exports
}
const seo = load('lib/product-seo.ts')
const product = { id: 'one', name: 'Ìbàdàn Blue Kimono', slug: 'ibadan-blue-kimono', fabric: 'Aso Oke', style: 'Kimono', description: 'Blue open-front kimono.', status: 'published' }

test('fallback uses recorded details, keeps names intact and does not invent claims', () => {
  const description = seo.productDescription(product)
  assert.ok(description.includes(product.name))
  assert.match(description, /Aso Oke/)
  assert.ok(description.length >= 140 && description.length <= 160, description)
  assert.doesNotMatch(description, /handmade|luxury|delivery|in stock|cotton/i)
  assert.notEqual(description, seo.productDescription({ ...product, name: 'Orange Aso Oke T-Shirt' }))
  const sparse = seo.productDescription({ name: 'Àṣọ', fabric: 'Others', description: '' })
  assert.doesNotMatch(sparse, /\b(?:Others|women|men|cotton|silk|occasion)\b/i)
})

test('saved descriptions are preserved verbatim including Unicode and HTML-sensitive characters', () => {
  const metaDescription = 'Shop Ìbàdàn & Òṣogbo — a customer’s "Adire" choice.'
  assert.equal(seo.productDescription({ ...product, metaDescription }), metaDescription)
  const html = renderToStaticMarkup(React.createElement('meta', { name: 'description', content: metaDescription }))
  assert.match(html, /&amp;/); assert.match(html, /&quot;/)
  assert.equal((html.match(/name="description"/g) || []).length, 1)
})

test('product metadata changes by slug, preserves SEO fields and inherits unrelated Open Graph data', async () => {
  const second = { ...product, id: 'two', name: 'Pink Damask Kimono', slug: 'pink-kimono', metaDescription: 'Saved product copy.', seoTitle: 'Saved title', canonicalUrl: 'https://adireteems.com/product/pink-kimono', noindex: true }
  const route = load('app/product/[slug]/page.tsx', {
    react: { cache: fn => fn },
    'next/navigation': { notFound: () => { throw Error('404') } },
    '@/lib/store-db': { readStore: async () => ({ products: [product, second, { ...product, slug: 'draft', status: 'draft' }] }) },
    '@/lib/product-seo': seo,
    '@/components/product-detail': {},
  })
  const parent = Promise.resolve({ openGraph: { siteName: 'Adire Teems', images: [{ url: 'https://adireteems.com/image.png' }] }, alternates: {} })
  const first = await route.generateMetadata({ params: Promise.resolve({ slug: product.slug }) }, parent)
  const next = await route.generateMetadata({ params: Promise.resolve({ slug: second.slug }) }, parent)
  assert.notEqual(first.description, next.description)
  assert.equal(next.description, second.metaDescription)
  assert.equal(next.title, 'Saved title')
  assert.equal(next.alternates.canonical, second.canonicalUrl)
  assert.equal(next.openGraph.description, second.metaDescription)
  assert.equal(next.openGraph.siteName, 'Adire Teems')
  assert.equal(next.openGraph.images.length, 1)
  assert.equal(next.robots.index, false)
  await assert.rejects(route.generateMetadata({ params: Promise.resolve({ slug: 'draft' }) }, parent), /404/)
  await assert.rejects(route.generateMetadata({ params: Promise.resolve({ slug: 'missing' }) }, parent), /404/)
})
