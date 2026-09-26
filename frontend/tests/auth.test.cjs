const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const path = require('node:path')
const ts = require('typescript')

function recovery(href, seed = {}) {
  const values = new Map(Object.entries(seed)), calls = [], options = []
  const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }
  const window = { location: { href }, sessionStorage: storage, history: { replaceState: (_, __, value) => { window.location.href = new URL(value, window.location.href).href } } }
  const client = { auth: {
    signOut: async arg => { calls.push(['signOut', arg]); return { error: null } },
    setSession: async arg => { calls.push(['setSession', arg]); return { error: null } },
    verifyOtp: async arg => { calls.push(['verifyOtp', arg]); return { error: null } },
    getUser: async () => ({ data: { user: { email: 'recovery@example.test' } }, error: null }),
  } }
  const module = { exports: {} }
  const source = fs.readFileSync(path.join(__dirname, '../lib/supabase/recovery.ts'), 'utf8')
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports: module.exports, module, window, sessionStorage: storage, URL, URLSearchParams, Date,
    process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-test-key' } },
    require: () => ({ createClient: (_, __, config) => { options.push(config); return client } }),
  })
  return { api: module.exports, calls, options, window, storage }
}

test('recovery consumes a valid fragment in isolated storage and removes URL tokens', async () => {
  const ctx = recovery('https://shop.example/reset-password#type=recovery&access_token=test-access&refresh_token=test-refresh')
  assert.equal(await ctx.api.openRecoverySession(), 'recovery@example.test')
  assert.equal(ctx.window.location.href, 'https://shop.example/reset-password')
  assert.equal(ctx.calls.filter(([name]) => name === 'setSession').length, 1)
  assert.equal(ctx.options[0].auth.storageKey, 'adire-password-recovery')
  assert.equal(ctx.options[0].auth.storage, ctx.window.sessionStorage)
  assert.equal(ctx.options[0].auth.detectSessionInUrl, false)
  assert.equal(ctx.calls[0][1].scope, 'local')
  await ctx.api.openRecoverySession()
  assert.equal(ctx.calls.filter(([name]) => name === 'setSession').length, 1, 'Reload/recheck must not consume the link twice')
  await ctx.api.closeRecoverySession()
  assert.equal(ctx.storage.getItem('adire-password-recovery-expires'), null)
})

test('missing, expired, and non-recovery links cannot establish a recovery session', async () => {
  for (const suffix of ['', '#error=access_denied&error_code=otp_expired', '#type=signup&access_token=test&refresh_token=test', '#type=recovery&access_token=test']) {
    const ctx = recovery('https://shop.example/reset-password' + suffix)
    await assert.rejects(() => ctx.api.openRecoverySession())
    assert.equal(ctx.calls.filter(([name]) => ['setSession', 'verifyOtp'].includes(name)).length, 0)
  }
  const ctx = recovery('https://shop.example/reset-password', { 'adire-password-recovery-expires': String(Date.now() - 1) })
  await assert.rejects(() => ctx.api.openRecoverySession())
})

test('a custom recovery email token uses Supabase verification, never admin credentials', async () => {
  const ctx = recovery('https://shop.example/reset-password?type=recovery&token_hash=single-use-token')
  await ctx.api.openRecoverySession()
  assert.equal(ctx.calls.find(([name]) => name === 'verifyOtp')[1].type, 'recovery')
  assert.equal(ctx.window.location.href, 'https://shop.example/reset-password')
})
