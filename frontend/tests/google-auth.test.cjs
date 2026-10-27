const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

function load(file, mocks = {}) {
  const module = { exports: {} }
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports: module.exports, module, require: name => mocks[name], URL, Response,
    process: { env: { NEXT_PUBLIC_APP_URL: 'https://adireteems.com' } },
  })
  return module.exports
}
const oauth = load('lib/supabase/oauth.ts')

test('Google return paths allow customer destinations and reject redirect attacks', () => {
  for (const value of ['/checkout', '/dashboard', '/dashboard/orders', '/order/abc-123']) {
    assert.equal(oauth.customerReturnPath(value), value)
  }
  for (const value of [null, '//evil.example', '/\\evil.example', 'https://evil.example', '/%2f%2fevil.example', '/admin', '/auth/callback', '/checkout\r\nLocation: evil']) {
    assert.equal(oauth.customerReturnPath(value), '/dashboard')
  }
})

function callback(result, throws = false) {
  const codes = [], scopes = []
  const route = load('app/auth/callback/route.ts', {
    '@/lib/supabase/oauth': oauth,
    'next/server': { NextResponse: { redirect: url => new Response(null, { status: 307, headers: { Location: String(url) } }) } },
    '@/lib/supabase/server': { createClient: async scope => {
      scopes.push(scope)
      return { auth: { exchangeCodeForSession: async code => {
        codes.push(code)
        if (throws) throw Error('Network error')
        return result
      } } }
    } },
  })
  return { ...route, codes, scopes }
}

test('callback exchanges the code with the customer client before returning to checkout', async () => {
  const route = callback({ error: null })
  const response = await route.GET({ url: 'https://adireteems.com/auth/callback?code=once&next=/checkout' })
  assert.equal(response.headers.get('location'), 'https://adireteems.com/checkout')
  assert.deepEqual(route.codes, ['once'])
  assert.deepEqual(route.scopes, [undefined])
  assert.equal(response.headers.get('cache-control'), 'no-store')
})

test('missing, denied, expired and failed codes cannot lead to a signed-in destination', async () => {
  for (const [query, result, throws] of [
    ['', { error: null }, false],
    ['?error=access_denied&code=ignored', { error: null }, false],
    ['?code=expired', { error: { message: 'Expired' } }, false],
    ['?code=once', {}, true],
  ]) {
    const route = callback(result, throws)
    const response = await route.GET({ url: 'https://adireteems.com/auth/callback' + query })
    assert.equal(response.headers.get('location'), 'https://adireteems.com/auth/error')
    if (!query || query.includes('access_denied')) assert.equal(route.codes.length, 0)
  }
})

test('callback keeps www cookies on the same host and rejects external next URLs', async () => {
  const route = callback({ error: null })
  const response = await route.GET({ url: 'https://www.adireteems.com/auth/callback?code=once&next=https://evil.example' })
  assert.equal(response.headers.get('location'), 'https://www.adireteems.com/dashboard')
})
