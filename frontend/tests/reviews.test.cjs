const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

function load(file, mocks = {}) {
  const module = { exports: {} }
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  new Function('module', 'exports', 'require', code)(module, module.exports, name => mocks[name])
  return module.exports
}
const body = load('lib/request-body.ts')
const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
function setup({ user = { id: 'customer-id' }, admin = false, trusted = true, duplicate = false } = {}) {
  const writes = [], queries = []
  const db = { auth: { getUser: async () => ({ data: { user } }) }, from(table) {
    const query = { select() { return query }, eq(column, value) { queries.push({ table, column, value }); return query }, order() { return query }, limit() { return query },
      insert(value) { writes.push({ table, value }); return Promise.resolve({ error: duplicate ? { code: '23505' } : null }) },
      update(value) { writes.push({ table, value }); return query },
      maybeSingle: async () => ({ data: { id }, error: null }),
      then(resolve, reject) { return Promise.resolve({ data: [], error: null }).then(resolve, reject) },
    }; return query
  } }
  const mocks = { '@/lib/request-body': body, '@/lib/admin-auth': { sameOrigin: () => trusted, adminSession: async () => admin ? { db } : null }, '@/lib/supabase/server': { createClient: async () => db } }
  return { customer: load('app/api/customer/reviews/route.ts', mocks), admin: load('app/api/admin/reviews/route.ts', mocks), writes, queries }
}
function request(payload, method = 'POST') { return new Request('https://adireteems.com/api/reviews', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }) }
const review = { productId: id, rating: 5, title: 'Lovely fabric', body: 'Beautiful colours.', displayName: 'Customer' }

test('unauthenticated users cannot submit or moderate reviews', async () => {
  const routes = setup({ user: null })
  assert.equal((await routes.customer.POST(request(review))).status, 401)
  assert.equal((await routes.admin.GET()).status, 401)
  assert.equal((await routes.admin.PATCH(request({ id, status: 'approved' }, 'PATCH'))).status, 401)
  assert.equal(routes.writes.length, 0)
})
test('cross-origin submissions and moderation cannot write', async () => {
  const routes = setup({ admin: true, trusted: false })
  assert.equal((await routes.customer.POST(request(review))).status, 403)
  assert.equal((await routes.admin.PATCH(request({ id, status: 'approved' }, 'PATCH'))).status, 403)
  assert.equal(routes.writes.length, 0)
})
test('submission always belongs to authenticated customer and awaits approval', async () => {
  const routes = setup()
  assert.equal((await routes.customer.POST(request({ ...review, customer_id: 'victim', status: 'approved' }))).status, 201)
  assert.equal(routes.writes[0].value.customer_id, 'customer-id')
  assert.equal(routes.writes[0].value.status, 'pending')
})
test('invalid ratings and oversized reviews never reach insertion', async () => {
  for (const change of [{ rating: 0 }, { rating: 6 }, { rating: 1.5 }, { body: ' ' }, { body: 'a'.repeat(3001) }]) {
    const routes = setup()
    assert.equal((await routes.customer.POST(request({ ...review, ...change }))).status, 400)
    assert.equal(routes.writes.length, 0)
  }
})
test('duplicate review gives an actionable conflict response', async () => {
  const routes = setup({ duplicate: true })
  assert.equal((await routes.customer.POST(request(review))).status, 409)
})
test('admin can approve reviews but cannot change their text or author', async () => {
  const routes = setup({ admin: true })
  assert.equal((await routes.admin.PATCH(request({ id, status: 'approved', body: 'replacement', customer_id: 'other' }, 'PATCH'))).status, 200)
  assert.deepEqual(routes.writes[0].value, { status: 'approved' })
})
test('customer review history is restricted to the signed-in customer', async () => {
  const routes = setup()
  const response = await routes.customer.GET()
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.ok(routes.queries.some(query => query.table === 'reviews' && query.column === 'customer_id' && query.value === 'customer-id'))
})
