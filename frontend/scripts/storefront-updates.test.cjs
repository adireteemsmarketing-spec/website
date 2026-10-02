const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

function load(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText
  const module = { exports: {} }
  new Function('module', 'exports', 'require', code)(module, module.exports, name => name in dependencies ? dependencies[name] : require(name))
  return module.exports
}
const promotion = load('lib/promotion.ts')
const storage = load('lib/storage.ts')
const media = load('lib/order-media.ts', { './storage': storage })
const promoData = { ...promotion.emptyPromotion, title: 'New collection', description: 'Discover our new arrivals', image: '/images/promo.png', linkLabel: 'Shop now', linkUrl: '/shop', published: true }

test('promotion accepts announcements without a button or image and rejects unsafe links', () => {
  assert.deepEqual(promotion.validatePromotion(promoData), promoData)
  assert.equal(promotion.validatePromotion({ ...promoData, image: '/images/Adire collection/promo.png' }).image, '/images/Adire collection/promo.png')
  assert.equal(promotion.validatePromotion({ ...promotion.emptyPromotion, title: 'Visit our lounge', published: true }).published, true)
  for (const linkUrl of ['javascript:alert(1)', '//example.com', '/\\example.com', 'http://example.com']) {
    assert.throws(() => promotion.validatePromotion({ ...promoData, linkUrl }))
  }
  assert.throws(() => promotion.validatePromotion({ ...promoData, title: '' }))
  assert.throws(() => promotion.validatePromotion({ ...promoData, linkLabel: '' }))
  assert.throws(() => promotion.validatePromotion({ ...promoData, description: 'x'.repeat(2001) }))
})

test('promotion write requires an admin and trusted origin, and changes only the promotion row', async () => {
  let authenticated = false, trusted = true, saved
  const route = load('app/api/admin/promotion/route.ts', {
    '@/lib/admin-auth': { adminSession: async () => authenticated ? { role: 'admin' } : null, sameOrigin: () => trusted },
    '@/lib/supabase/admin': { createAdminClient: () => ({ from: table => {
      assert.equal(table, 'site_content')
      return { upsert: async value => { saved = value; return { error: null } } }
    } }) },
    '@/lib/promotion': promotion, '@/lib/storage': storage,
  })
  const request = data => new Request('https://store.example/api/admin/promotion', { method: 'POST', body: JSON.stringify(data) })
  assert.equal((await route.POST(request(promoData))).status, 403)
  authenticated = true; trusted = false
  assert.equal((await route.POST(request(promoData))).status, 403)
  trusted = true
  assert.equal((await route.POST(request({ ...promoData, image: '/api/media?path=draft-media/banner.png' }))).status, 200)
  assert.equal(saved.key, 'homepage_promotion')
  assert.equal(saved.value.image, 'draft-media/banner.png')
  assert.equal(saved.published, true)
  assert.equal((await route.POST(request({ ...promoData, published: false }))).status, 200)
  assert.equal(saved.published, false)
})

test('order images include every image in display order and tolerate missing products', () => {
  const item = { product_name: 'Adire set', product_variants: { products: { slug: 'adire-set', product_images: [
    { storage_path: 'product-images/back.png', sort_order: 2, alt_text: 'Back view' },
    { storage_path: '/images/front.png', sort_order: 0, alt_text: null },
  ] } } }
  const result = media.orderItemMedia(item)
  assert.equal(result.productUrl, '/product/adire-set')
  assert.deepEqual(result.images, [{ url: '/images/front.png', alt: 'Adire set' }, { url: '/api/media?path=product-images%2Fback.png', alt: 'Back view' }])
  assert.deepEqual(media.orderItemMedia({ product_name: 'Archived item', product_variants: null }), { productUrl: null, images: [] })
})

test('Paystack callback redirects only verified payments to thank-you page', async () => {
  for (const paid of [true, false]) {
    const route = load('app/api/payments/paystack/callback/route.ts', {
      '@/lib/paystack': { paystackConfig: () => ({ origin: 'https://store.example' }), verifyPaystack: async reference => { assert.equal(reference, 'ref123'); return { paid, orderId: 'order123' } } },
    })
    const response = await route.GET(new Request('https://store.example/api/payments/paystack/callback?reference=ref123'))
    assert.equal(response.headers.get('location'), paid ? 'https://store.example/thank-you/order123' : 'https://store.example/order/order123?payment=pending')
  }
  const route = load('app/api/payments/paystack/callback/route.ts', { '@/lib/paystack': { paystackConfig: () => ({ origin: 'https://store.example' }), verifyPaystack: async () => { throw Error('Unverified') } } })
  assert.equal((await route.GET(new Request('https://store.example/callback'))).headers.get('location'), 'https://store.example/dashboard/orders?payment=unconfirmed')
})

test('thank-you page uses account-owned verified payment data, not URL claims', () => {
  const order = { id: 'order123', status: 'paid', order_number: 'AT123', currency: 'NGN', total: 25000, order_items: [], payments: [{ status: 'successful' }] }
  let orders = [order]
  const { OrderThankYou } = load('components/order-thank-you.tsx', {
    'next/link': ({ children, ...props }) => React.createElement('a', props, children),
    './customer-orders': { useCustomerOrders: () => ({ orders, ready: true, error: '', refresh: async () => {} }) },
    './customer-provider': { useCustomer: () => ({ customer: { id: 'owner' }, loaded: true }) },
    './customer-sign-in': { CustomerSignIn: () => 'Sign in' },
    './order-payment': { OrderPayment: () => 'Payment details' },
  })
  const render = () => renderToStaticMarkup(React.createElement(OrderThankYou, { id: 'order123' }))
  assert.match(render(), /Thank you for your purchase/)
  orders = [{ ...order, payments: [] }]
  assert.doesNotMatch(render(), /Thank you for your purchase/)
  orders = [{ ...order, status: 'refunded' }]
  assert.doesNotMatch(render(), /Thank you for your purchase/)
  orders = []
  assert.match(render(), /Order not found/)
})
