'use client'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const storageKey = 'adire-password-recovery'
const expiryKey = `${storageKey}-expires`
let client: SupabaseClient | undefined
export function createRecoveryClient() {
  if (!client) client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    { auth: { storageKey, storage: window.sessionStorage, persistSession: true, autoRefreshToken: false, detectSessionInUrl: false, flowType: 'implicit' } },
  )
  return client
}

export async function closeRecoverySession() {
  try { await createRecoveryClient().auth.signOut({ scope: 'local' }) }
  finally { sessionStorage.removeItem(storageKey); sessionStorage.removeItem(expiryKey); client = undefined }
}

export async function openRecoverySession() {
  const url = new URL(window.location.href), fragment = new URLSearchParams(url.hash.slice(1))
  const access_token = fragment.get('access_token'), refresh_token = fragment.get('refresh_token')
  const token_hash = url.searchParams.get('token_hash')
  const type = fragment.get('type') || url.searchParams.get('type')
  const linkError = fragment.has('error') || url.searchParams.has('error')
  // Remove credentials from the address bar and history before rendering the form.
  window.history.replaceState(null, '', '/reset-password')
  const db = createRecoveryClient()
  if (linkError) { await closeRecoverySession(); throw Error('This reset link has expired or has already been used. Request a new link below.') }
  if (access_token || refresh_token || token_hash) {
    await closeRecoverySession()
    if (type !== 'recovery' || (!token_hash && (!access_token || !refresh_token))) throw Error('This is not a valid password reset link. Request a new link below.')
    const recovery = createRecoveryClient()
    const { error } = token_hash
      ? await recovery.auth.verifyOtp({ type: 'recovery', token_hash })
      : await recovery.auth.setSession({ access_token: access_token!, refresh_token: refresh_token! })
    if (error) throw Error('This reset link has expired or is invalid. Request a new link below.')
    sessionStorage.setItem(expiryKey, String(Date.now() + 15 * 60 * 1000))
  } else if (Number(sessionStorage.getItem(expiryKey) || 0) <= Date.now()) {
    await closeRecoverySession()
    throw Error('Open the password reset link from your email, or request a new one below.')
  }
  const { data: { user }, error } = await (client || db).auth.getUser()
  if (error || !user) { await closeRecoverySession(); throw Error('Unable to verify this reset link. Request a new one below.') }
  return user.email || ''
}
