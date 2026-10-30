/* eslint-disable @typescript-eslint/no-require-imports -- Node tests use CommonJS. */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
function load(file, mocks = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  const loaded = { exports: {} }
  new Function('module', 'exports', 'require', compiled)(loaded, loaded.exports, name => name in mocks ? mocks[name] : require(name))
  return loaded.exports
}
const Link = ({ children, ...props }) => React.createElement('a', props, children)
const brand = load('lib/brand.ts')

test('tracking entry uses the existing authenticated order list', () => {
  const route = load('app/order/page.tsx', { 'next/link': Link, '@/components/customer-orders': { OrderList: () => React.createElement('div', {}, 'Authenticated orders') } })
  const html = renderToStaticMarkup(React.createElement(route.default))
  assert.match(html, /Track your order/)
  assert.match(html, /Authenticated orders/)
  const oauth = load('lib/supabase/oauth.ts')
  assert.equal(oauth.customerReturnPath('/order'), '/order')
})

test('reviews query approved public fields and render the real data or a clear empty/error state', async () => {
  for (const outcome of [ { data: [{ id: 'review', rating: 4, title: 'My purchase', body: 'Helpful support & lovely colours.', display_name: 'Customer' }], error: null }, { data: [], error: null }, { data: null, error: { message: 'Unavailable' } } ]) {
    const calls = []
    const query = { select: value => { calls.push(['select', value]); return query }, eq: (...args) => { calls.push(['eq', ...args]); return query }, order: () => query, limit: async () => outcome }
    const route = load('app/reviews/page.tsx', { 'next/link': Link, '@/lib/supabase/public': { createPublicClient: () => ({ from: table => { assert.equal(table, 'reviews'); return query } }) } })
    const html = renderToStaticMarkup(await route.default())
    assert.deepEqual(calls[1], ['eq', 'status', 'approved'])
    assert.doesNotMatch(calls[0][1], /customer_id|\*/)
    if (outcome.error) assert.match(html, /unavailable right now/)
    else if (!outcome.data.length) assert.match(html, /no published reviews/)
    else { assert.match(html, /Helpful support &amp; lovely colours/); assert.match(html, /4 out of 5 stars/) }
  }
})

test('policies use the confirmed payment, delivery and contact information without invented deadlines', () => {
  const route = load('app/policies/page.tsx', { 'next/link': Link, '@/lib/brand': brand })
  const html = renderToStaticMarkup(React.createElement(route.default))
  assert.match(html, /Paystack/)
  assert.match(html, /Delivery charges are arranged separately/)
  assert.match(html, /adireteemsmarketing@gmail.com/)
  assert.match(html, /Meta Pixel/)
  assert.doesNotMatch(html, /30-day|prepaid|free returns|PayPal|Stripe|5-7 business/)
  for (const id of ['orders', 'delivery', 'returns', 'product-care', 'privacy', 'contact']) assert.ok(html.includes(`id="${id}"`))
})
