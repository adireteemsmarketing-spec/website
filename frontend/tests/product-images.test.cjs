/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS tests load the installed frontend packages. */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
function load(file, mocks = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  const loaded = { exports: {} }
  new Function('module', 'exports', 'require', code)(loaded, loaded.exports, name => name in mocks ? mocks[name] : require(name))
  return loaded.exports
}
const storage = load('lib/storage.ts')
const images = load('lib/product-images.ts', { './storage': storage })

test('gallery validation preserves ordering, normalizes storage paths and supports descriptive alt text', () => {
  const result = images.productImagePayload([
    { url: '/api/media?path=draft-media%2Ffront.webp', alt: '  Front & neckline  ' },
    { url: 'https://example.com/back.jpg', alt: '' },
  ], 'Ìbàdàn Kimono')
  assert.deepEqual(result, [{ path: 'draft-media/front.webp', alt: 'Front & neckline' }, { path: 'https://example.com/back.jpg', alt: 'Ìbàdàn Kimono' }])
})

test('invalid galleries, duplicate photos and unsafe URLs cannot be saved', () => {
  for (const value of [[], null, {}, [{ url: 'javascript:alert(1)', alt: '' }], [{ url: '//evil.example/photo', alt: '' }], [{ url: '/\\evil.example/photo', alt: '' }], [{ url: '/api/media?path=other%2Ffile.png', alt: '' }], [{ url: '/photo.jpg', alt: 12 }], Array.from({ length: 21 }, (_, index) => ({ url: `/photo-${index}.jpg`, alt: '' })), [{ url: '/photo.jpg', alt: '' }, { url: '/photo.jpg', alt: '' }]]) {
    assert.throws(() => images.productImagePayload(value, 'Product'))
  }
  assert.throws(() => images.productImagePayload([{ url: 'https://user:password@example.com/image.png', alt: '' }], 'Product'))
})

test('product gallery renders every photo and keeps single-image products compatible', () => {
  const { ProductGallery } = load('components/product-gallery.tsx')
  const product = { name: 'Adire Kimono', image: '/cover.jpg', images: [{ url: '/cover.jpg', alt: 'Front' }, { url: '/back.jpg', alt: 'Back' }, { url: '/detail.jpg', alt: 'Detail' }] }
  const html = renderToStaticMarkup(React.createElement(ProductGallery, { product }))
  assert.equal((html.match(/aria-pressed=/g) || []).length, 3)
  assert.match(html, /\/back.jpg/)
  assert.match(html, /\/detail.jpg/)
  const single = renderToStaticMarkup(React.createElement(ProductGallery, { product: { ...product, images: [] } }))
  assert.match(single, /\/cover.jpg/)
  assert.doesNotMatch(single, /aria-pressed=/)
})

function elements(node, match) {
  if (!node || typeof node !== 'object') return []
  return [...(match(node) ? [node] : []), ...React.Children.toArray(node.props?.children).flatMap(child => elements(child, match))]
}
function editor(props) {
  const component = load('components/product-images-editor.tsx', {
    react: { ...React, useState: initial => [initial, () => {}], useRef: initial => ({ current: initial }) },
    '@/lib/product-images': images,
  })
  return component.ProductImagesEditor(props)
}

test('multiple-file selection appends successful uploads, retains existing photos and unlocks after partial failure', async () => {
  const previousFetch = global.fetch, busy = [], changes = [], calls = []
  const existing = [{ url: '/existing.jpg', alt: 'Existing photo' }]
  global.fetch = async (url, options) => {
    calls.push({ url, file: options.body.get('image').name })
    if (options.body.get('image').name === 'bad.png') return { ok: false, json: async () => ({ error: 'Unsupported image.' }) }
    return { ok: true, json: async () => ({ url: `/uploaded-${calls.length}.png` }) }
  }
  try {
    const tree = editor({ images: existing, onChange: value => changes.push(value), busy: false, onBusyChange: value => busy.push(value), name: 'Adire Kimono' })
    const input = elements(tree, node => node.type === 'input' && node.props.type === 'file')[0]
    assert.equal(input.props.multiple, true)
    await input.props.onChange({ currentTarget: { files: ['front.png', 'bad.png', 'back.png'].map(name => new File(['image'], name, { type: 'image/png' })), value: 'selection' } })
    assert.deepEqual(calls.map(call => call.file), ['front.png', 'bad.png', 'back.png'])
    assert.ok(calls.every(call => call.url === '/api/admin/images'))
    assert.deepEqual(changes[0], [...existing, { url: '/uploaded-1.png', alt: 'Adire Kimono' }, { url: '/uploaded-3.png', alt: 'Adire Kimono' }])
    assert.deepEqual(busy, [true, false])
  } finally { global.fetch = previousFetch }
})

test('cover and removal controls update the complete ordered gallery', () => {
  const initial = [{ url: '/front.jpg', alt: 'Front' }, { url: '/back.jpg', alt: 'Back' }], changes = []
  const tree = editor({ images: initial, onChange: value => changes.push(value), busy: false, onBusyChange: () => {}, name: 'Product' })
  elements(tree, node => node.type === 'button' && node.props.children === 'Make cover')[0].props.onClick()
  assert.deepEqual(changes[0], [initial[1], initial[0]])
  elements(tree, node => node.type === 'button' && node.props['aria-label'] === 'Remove photo 1')[0].props.onClick()
  assert.deepEqual(changes[1], [initial[1]])
})
