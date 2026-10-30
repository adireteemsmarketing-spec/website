/* eslint-disable @typescript-eslint/no-require-imports -- Node regression tests. */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
function load(file) {
  const loaded = { exports: {} }
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  new Function('module', 'exports', code)(loaded, loaded.exports)
  return loaded.exports
}
const body = load('lib/request-body.ts')
const oauth = load('lib/supabase/oauth.ts')
const request = text => new Request('https://adireteems.com/api/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: text })

test('request limits use bytes and reject both declared and streamed oversized bodies', async () => {
  await assert.rejects(body.readRequestText(request('éé'), 3), error => error.status === 413)
  const declared = request('{}'); declared.headers.set('content-length', '100000')
  await assert.rejects(body.readRequestText(declared, 100), error => error.status === 413)
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(80)); controller.enqueue(new Uint8Array(80)); controller.close() } })
  const streamed = new Request('https://adireteems.com', { method: 'POST', body: stream, duplex: 'half' })
  await assert.rejects(body.readRequestText(streamed, 100), error => error.status === 413)
})

test('JSON accepts only object payloads with the correct media type', async () => {
  assert.deepEqual(await body.readJsonBody(request('{"name":"Ìbàdàn"}'), 100), { name: 'Ìbàdàn' })
  for (const value of ['null', '[]', 'false', '{broken']) await assert.rejects(body.readJsonBody(request(value)), error => error.status === 400)
  const wrongType = new Request('https://adireteems.com', { method: 'POST', body: '{}' })
  await assert.rejects(body.readJsonBody(wrongType), error => error.status === 415)
})

test('bounded reads preserve the exact raw webhook body and multipart boundary', async () => {
  const raw = '{"reference":"once","name":"Ìbàdàn"}\n'
  assert.equal(await body.readRequestText(request(raw), 100), raw)
  const form = new FormData(); form.set('image', new File(['file'], 'photo.png', { type: 'image/png' }))
  const upload = new Request('https://adireteems.com/api/admin/images', { method: 'POST', body: form })
  assert.equal((await body.readFormBody(upload, 1000)).get('image').name, 'photo.png')
  const tooLarge = new Request('https://adireteems.com/api/admin/images', { method: 'POST', body: form })
  await assert.rejects(body.readFormBody(tooLarge, 3), error => error.status === 413)
})

test('OAuth callbacks never redirect to an attacker-controlled request host', () => {
  assert.equal(oauth.publicAuthOrigin('https://evil.example/auth/callback', 'https://adireteems.com'), 'https://adireteems.com')
  assert.equal(oauth.publicAuthOrigin('https://adireteems.com.evil.example/auth/callback', 'https://adireteems.com'), 'https://adireteems.com')
  assert.equal(oauth.publicAuthOrigin('https://www.adireteems.com/auth/callback', 'https://adireteems.com'), 'https://www.adireteems.com')
  assert.equal(oauth.publicAuthOrigin('http://localhost:3000/auth/callback', 'http://localhost:3000'), 'http://localhost:3000')
  assert.equal(oauth.publicAuthOrigin('https://evil.example/auth/callback', ''), 'https://adireteems.com')
})
