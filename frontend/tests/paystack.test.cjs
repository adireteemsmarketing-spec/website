// Run from the repository root: node --test frontend/tests/paystack.test.cjs
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const crypto = require('node:crypto')
const secret = 'sk_test_0123456789'
const reference = 'ADR-' + 'a'.repeat(32)

function load(file, mocks, fetch) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const module = { exports: {} }
  vm.runInNewContext(compiled, { exports: module.exports, module,
    require: name => name === 'server-only' ? {} : mocks[name] || require(name),
    process: { env: { PAYSTACK_SECRET_KEY: secret, NEXT_PUBLIC_APP_URL: 'https://shop.example.test' } },
    fetch, URL, Buffer, AbortSignal, Response, Request, console,
  }, { filename: file })
  return module.exports
}
function fakeDb(reads = [], rpcData = 'order-1') {
  const writes = [], calls = []
  return { writes, calls,
    from(table) {
      const query = { select() { return query }, eq() { return query }, order() { return query }, limit() { return query },
        update(value) { writes.push({ table, value }); return query },
        maybeSingle: async () => ({ data: reads.shift(), error: null }),
        then(resolve, reject) { return Promise.resolve({ error: null }).then(resolve, reject) },
      }; return query
    },
    async rpc(name, args) { calls.push({ name, args }); return { data: rpcData, error: null } },
  }
}
const attempt = { order_id: 'order-1', reference, amount: 25000, currency: 'NGN', provider_mode: 'test', status: 'pending' }
const transaction = { reference, amount: 2500000, currency: 'NGN', domain: 'test', status: 'success' }
const reply = data => new Response(JSON.stringify({ status: true, data }), { status: 200 })
function paymentModule(db, fetch) { return load('lib/paystack.ts', { '@/lib/supabase/admin': { createAdminClient: () => db } }, fetch) }

test('raw-body webhook HMAC rejects tampered bodies and malformed signatures', () => {
  const payment = paymentModule(fakeDb(), () => { throw Error('Unexpected network') })
  const body = JSON.stringify({ event: 'charge.success', data: { reference } })
  const signature = crypto.createHmac('sha512', secret).update(body).digest('hex')
  assert.equal(payment.validPaystackSignature(body, signature), true)
  assert.equal(payment.validPaystackSignature(body + ' ', signature), false)
  for (const invalid of [null, '', 'a', 'z'.repeat(128)]) assert.equal(payment.validPaystackSignature(body, invalid), false)
})

test('verified success settles the saved reference and exact NGN amount', async () => {
  const db = fakeDb([attempt]), payment = paymentModule(db, async () => reply(transaction))
  const result = await payment.verifyPaystack(reference)
  assert.equal(result.paid, true)
  assert.equal(db.calls[0].name, 'settle_paystack_payment')
  assert.equal(db.calls[0].args.paid_amount, 2500000)
  assert.equal(db.calls[0].args.payment_ref, reference)
})

test('wrong amount, currency, mode or reference never settles an order', async () => {
  for (const change of [{ amount: 1 }, { currency: 'USD' }, { domain: 'live' }, { reference: 'someone-else' }]) {
    const db = fakeDb([attempt]), payment = paymentModule(db, async () => reply({ ...transaction, ...change }))
    await assert.rejects(() => payment.verifyPaystack(reference), /could not be verified/)
    assert.equal(db.calls.length, 0)
    assert.equal(db.writes.length, 0)
  }
})

test('pending and failed transactions cannot mark an order paid', async () => {
  for (const status of ['pending', 'ongoing', 'failed', 'abandoned']) {
    const db = fakeDb([attempt]), payment = paymentModule(db, async () => reply({ ...transaction, status }))
    assert.equal((await payment.verifyPaystack(reference)).paid, false)
    assert.equal(db.calls.length, 0)
  }
})

test('initialization sends saved price in kobo and the configured callback', async () => {
  const db = fakeDb([null], { ...attempt, id: 'payment-1', email: 'buyer@example.test', checkout_url: null })
  let sent
  const payment = paymentModule(db, async (url, options) => {
    sent = JSON.parse(options.body)
    assert.equal(url, 'https://api.paystack.co/transaction/initialize')
    return reply({ authorization_url: 'https://checkout.paystack.com/test-session', reference })
  })
  const result = await payment.initializePaystack('order-1', 'buyer-1')
  assert.equal(sent.amount, 2500000)
  assert.equal(sent.callback_url, 'https://shop.example.test/api/payments/paystack/callback')
  assert.equal(sent.metadata.cancel_action, 'https://shop.example.test/order/order-1?payment=cancelled')
  assert.equal(result.authorizationUrl, 'https://checkout.paystack.com/test-session')
  assert.equal(result.testMode, true)
  assert.equal(db.writes.length, 1)
})

test('a provider outage does not open another payment for an existing checkout', async () => {
  const db = fakeDb([{ reference, provider_mode: 'test', checkout_url: 'https://checkout.paystack.com/existing' }, attempt])
  const payment = paymentModule(db, async () => { throw Error('Network down') })
  await assert.rejects(() => payment.initializePaystack('order-1', 'buyer-1'), /earlier payment attempt/)
  assert.equal(db.calls.length, 0)
})

test('unsigned webhook cannot reach the database or verification', async () => {
  const route = load('app/api/payments/paystack/webhook/route.ts', {
    '@/lib/paystack': { validPaystackSignature: () => false, verifyPaystack: () => { throw Error('Should not verify') } },
    '@/lib/supabase/admin': { createAdminClient: () => { throw Error('Should not access database') } },
  })
  const response = await route.POST(new Request('https://shop.example.test/webhook', { method: 'POST', body: '{}' }))
  assert.equal(response.status, 401)
})

test('webhook retries when database settlement is temporarily unavailable', async () => {
  const route = load('app/api/payments/paystack/webhook/route.ts', {
    '@/lib/paystack': { validPaystackSignature: () => true, verifyPaystack: async () => { throw Error('Database unavailable') } },
    '@/lib/supabase/admin': { createAdminClient: () => fakeDb([{ id: 'payment-1' }]) },
  })
  const response = await route.POST(new Request('https://shop.example.test/webhook', { method: 'POST', body: JSON.stringify({ event: 'charge.success', data: { reference } }) }))
  assert.equal(response.status, 503)
})

test('callback ignores user-supplied payment status and redirects to configured origin', async () => {
  const route = load('app/api/payments/paystack/callback/route.ts', {
    '@/lib/paystack': { paystackConfig: () => ({ origin: 'https://shop.example.test' }), verifyPaystack: async () => ({ orderId: 'order-1', paid: false }) },
  })
  const response = await route.GET(new Request('https://attacker.example/callback?reference=' + reference + '&status=success'))
  assert.equal(response.headers.get('location'), 'https://shop.example.test/order/order-1?payment=pending')
})
