const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const mod = { exports: {} }
vm.runInNewContext(ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, '../lib/request-origin.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: mod.exports, module: mod, URL, process: { env: {} } })
const { isTrustedOrigin } = mod.exports
const request = headers => new Request('http://localhost:3000/api/admin/session', { headers })

test('accepts the browser origin when a proxy exposes an internal request URL', () => {
  assert.equal(isTrustedOrigin(request({ origin: 'https://shop.example', host: 'shop.example' }), 'https://old.example'), true)
  assert.equal(isTrustedOrigin(request({ origin: 'http://localhost:3000' })), true)
  assert.equal(isTrustedOrigin(request({ origin: 'https://configured.example', host: 'localhost:3000' }), 'https://configured.example'), true)
})

test('rejects cross-site requests, malformed origins, port mismatches and forwarded-host spoofing', () => {
  for (const origin of ['', 'null', 'https://evil.example', 'https://shop.example.evil.test', 'https://shop.example:444', 'https://shop.example/path', 'ftp://shop.example']) {
    assert.equal(isTrustedOrigin(request({ origin, host: 'shop.example', 'x-forwarded-host': 'evil.example' })), false, origin)
  }
  assert.equal(isTrustedOrigin(request({ origin: 'https://evil.example', 'x-forwarded-host': 'evil.example' })), false)
})
