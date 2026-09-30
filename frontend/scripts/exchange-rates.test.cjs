const { test } = require('node:test')
const assert = require('node:assert/strict')
const ts = require('typescript')
const fs = require('node:fs')
const path = require('node:path')

function compile(file, dependencies, fetchMock) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText
  const module = { exports: {} }
  new Function('module', 'exports', 'require', 'fetch', code)(module, module.exports, name => dependencies[name] ?? require(name), fetchMock)
  return module.exports
}

const currency = compile('../lib/currency.ts', {})
const rows = ['NGN', 'GBP', 'EUR'].map((quote, i) => ({ base: 'USD', quote, rate: [1329.07, 0.75432, 0.88081][i], date: '2026-09-30' }))
const readOnly = async () => { throw new Error('EROFS: read-only file system') }

test('valid rates succeed when cache directory creation or writing fails', async () => {
  for (const mkdir of [readOnly, async () => {}]) {
    const route = compile('../app/api/exchange-rates/route.ts', {
      '@/lib/currency': currency,
      'node:fs/promises': { mkdir, writeFile: readOnly, readFile: readOnly },
    }, async () => Response.json(rows))
    const response = await route.GET()
    assert.equal(response.status, 200)
    const data = await response.json()
    assert.equal(currency.validRates(data), true)
    assert.equal(data.cached, false)
  }
})

test('retains valid rates in memory during a provider outage without writable disk', async () => {
  let offline = false
  const route = compile('../app/api/exchange-rates/route.ts', {
    '@/lib/currency': currency,
    'node:fs/promises': { mkdir: readOnly, writeFile: readOnly, readFile: readOnly },
  }, async () => {
    if (offline) throw new Error('Network unavailable')
    return Response.json(rows)
  })
  await route.GET()
  offline = true
  const response = await route.GET()
  assert.equal(response.status, 200)
  assert.equal((await response.json()).cached, true)
})

test('incomplete rates are rejected when no valid cache exists', async () => {
  const route = compile('../app/api/exchange-rates/route.ts', {
    '@/lib/currency': currency,
    'node:fs/promises': { mkdir: readOnly, writeFile: readOnly, readFile: readOnly },
  }, async () => Response.json(rows.slice(1)))
  assert.equal((await route.GET()).status, 503)
})
