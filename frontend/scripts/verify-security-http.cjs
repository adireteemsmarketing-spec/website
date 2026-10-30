/* eslint-disable @typescript-eslint/no-require-imports -- Read-only Node HTTP verification. */
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const origin = 'http://localhost:3018'
async function main() {
  const results = []
  async function check(url, options, status) {
    const response = await fetch(origin + url, { ...options, redirect: 'manual', signal: AbortSignal.timeout(15000) })
    assert.equal(response.status, status, url)
    const text = await response.text()
    results.push({ path: url, method: options?.method || 'GET', status })
    return { response, text }
  }
  const home = await check('/', {}, 200)
  assert.equal(home.response.headers.get('x-frame-options'), 'DENY')
  assert.equal(home.response.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(home.response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin')
  assert.match(home.response.headers.get('content-security-policy'), /frame-ancestors 'none'/)
  assert.match(home.response.headers.get('strict-transport-security'), /max-age=31536000/)
  assert.equal(home.response.headers.get('x-powered-by'), null)
  for (const [url, status] of [['/api/admin/store',401],['/api/admin/orders',403],['/api/admin/contact',401],['/api/admin/promotion',403],['/api/customer/orders',401],['/api/customer/cart',401]]) {
    const { response } = await check(url, {}, status)
    assert.match(response.headers.get('cache-control'), /no-store/)
  }
  const signedOut = await check('/api/admin/session', {}, 200)
  assert.equal(JSON.parse(signedOut.text).authenticated, false)
  const headers = { Origin: origin, 'Content-Type': 'application/json' }
  await check('/api/admin/session', { method: 'POST', headers, body: 'x'.repeat(8001) }, 413)
  await check('/api/admin/session', { method: 'POST', headers, body: '{malformed' }, 400)
  await check('/api/admin/session', { method: 'POST', headers: { Origin: origin }, body: '{}' }, 415)
  for (const url of ['/api/admin/session','/api/admin/store','/api/contact','/api/customer/orders','/api/payments/paystack/initialize']) {
    await check(url, { method: 'POST', headers: { Origin: 'https://evil.example', 'X-Forwarded-Host': 'evil.example', 'Content-Type': 'application/json' }, body: '{}' }, 403)
  }
  await check('/api/payments/paystack/webhook', { method: 'POST', body: '{}' }, 401)
  await check('/api/payments/paystack/webhook', { method: 'POST', body: 'x'.repeat(1000001) }, 413)
  const auth = await check('/auth/callback?error=access_denied', { headers: { 'X-Forwarded-Host': 'evil.example' } }, 307)
  assert.notEqual(new URL(auth.response.headers.get('location'), origin).hostname, 'evil.example')
  const output = path.resolve(__dirname, '../../artifacts/security/http-checks.json')
  fs.writeFileSync(output, JSON.stringify({ browserHeadersPassed: true, results }, null, 2) + '\n')
  console.log(`PASS: browser security headers and ${results.length} HTTP security checks; no credentials or live writes used.`)
}
main().catch(error => { console.error(error); process.exitCode = 1 })
