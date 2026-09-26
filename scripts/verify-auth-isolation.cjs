// Opt-in integration test against the configured project and running application.
// Creates two temporary accounts, sends no emails, and deletes only those accounts.
// node --env-file=frontend/.env --env-file=frontend/.env.local scripts/verify-auth-isolation.cjs
const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const { createClient } = require('../frontend/node_modules/@supabase/supabase-js')
const { createServerClient } = require('../frontend/node_modules/@supabase/ssr')
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const root = createClient(url, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
const origin = 'http://localhost:3000'
const created = []
const jar = new Map()
const customerCookies = () => [...jar].filter(([name]) => !name.includes('-admin-auth-token'))
function browserDb() { return createServerClient(url, key, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: values => { for (const { name, value } of values) { if (value) jar.set(name, value); else jar.delete(name) } } } }) }
async function request(path, method = 'GET', body) {
  const response = await fetch(origin + path, { method, headers: { Origin: origin, 'Content-Type': 'application/json', Cookie: [...jar].map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join('; ') }, ...(body ? { body: JSON.stringify(body) } : {}) })
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(';')[0], index = pair.indexOf('='), name = pair.slice(0, index), value = decodeURIComponent(pair.slice(index + 1))
    if (value) jar.set(name, value); else jar.delete(name)
  }
  return { status: response.status, data: await response.json() }
}
async function main() {
  try {
    const credentials = []
    for (const role of ['user', 'admin']) {
      const email = `auth-check-${role}-${randomUUID()}@example.test`, password = `Check!${randomUUID()}Aa9`
      const { data, error } = await root.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: 'Temporary auth integration check' } })
      if (error) throw error
      created.push(data.user.id)
      if (role === 'admin') { const { error } = await root.from('profiles').update({ role }).eq('user_id', data.user.id); if (error) throw error }
      credentials.push({ email, password, id: data.user.id })
    }
    const [shopper, staff] = credentials
    const customer = browserDb()
    const { error: loginError } = await customer.auth.signInWithPassword(shopper)
    if (loginError) throw loginError
    const initialCookies = JSON.stringify(customerCookies())
    assert.equal((await request('/api/customer')).data.customer.id, shopper.id)
    assert.equal((await request('/api/admin/session')).data.authenticated, false)
    assert.equal((await request('/api/admin/session', 'POST', staff)).status, 200)
    assert.equal(JSON.stringify(customerCookies()), initialCookies)
    assert.equal((await request('/api/admin/session')).data.authenticated, true)
    assert.equal((await request('/api/customer')).data.customer.id, shopper.id)
    console.log('PASS: admin login preserves shopper cookies and identity; both sessions coexist')
    assert.equal((await request('/api/admin/session', 'POST', shopper)).status, 403)
    assert.equal((await request('/api/admin/session')).data.authenticated, true)
    assert.equal((await request('/api/customer')).data.customer.id, shopper.id)
    console.log('PASS: rejected non-admin login preserves the existing admin and shopper')
    assert.equal((await request('/api/admin/session', 'DELETE')).status, 200)
    assert.equal((await request('/api/admin/session')).data.authenticated, false)
    assert.equal((await request('/api/customer')).data.customer.id, shopper.id)
    const { error: refreshError } = await customer.auth.refreshSession()
    if (refreshError) throw refreshError
    console.log('PASS: admin logout leaves the shopper session valid and refreshable')
    assert.equal((await request('/api/admin/session', 'POST', staff)).status, 200)
    await customer.auth.signOut({ scope: 'local' })
    assert.equal((await request('/api/customer')).data.customer, null)
    assert.equal((await request('/api/admin/session')).data.authenticated, true)
    console.log('PASS: customer logout preserves admin access')

    // Generate, redeem and update a real recovery session without delivering mail.
    const redirectTo = (process.env.NEXT_PUBLIC_APP_URL || origin) + '/reset-password'
    const { data: link, error: linkError } = await root.auth.admin.generateLink({ type: 'recovery', email: shopper.email, options: { redirectTo } })
    if (linkError) throw linkError
    console.log('Recovery redirect allowlist:', link.properties.redirect_to === redirectTo ? 'configured' : 'NEEDS CONFIGURATION (requested reset URL was not retained)')
    const recovery = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
    const { error: verifyError } = await recovery.auth.verifyOtp({ type: 'recovery', token_hash: link.properties.hashed_token })
    if (verifyError) throw verifyError
    const { error: reusedError } = await createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }).auth.verifyOtp({ type: 'recovery', token_hash: link.properties.hashed_token })
    assert(reusedError, 'Recovery tokens must be single use')
    const nextPassword = `Changed!${randomUUID()}Aa9`
    const { error: changeError } = await recovery.auth.updateUser({ password: nextPassword })
    if (changeError) throw changeError
    await recovery.auth.signOut({ scope: 'local' })
    const check = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    assert((await check.auth.signInWithPassword(shopper)).error, 'Old password must stop working')
    assert.equal((await check.auth.signInWithPassword({ email: shopper.email, password: nextPassword })).error, null)
    await check.auth.signOut({ scope: 'local' })
    assert.equal((await request('/api/admin/session')).data.authenticated, true)
    console.log('PASS: recovery token is single-use; new password works, old password fails, unrelated admin session stays signed in')
  } finally {
    for (const id of created) {
      const { error } = await root.auth.admin.deleteUser(id)
      if (error) { console.error('Temporary account cleanup failed:', id, error.message); process.exitCode = 1 }
    }
    if (created.length) console.log('Temporary test accounts cleaned up')
  }
}
main().catch(error => { console.error('FAIL:', error.message); process.exitCode = 1 })
