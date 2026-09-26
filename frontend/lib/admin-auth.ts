import 'server-only'
import { createClient } from './supabase/server'
import { isTrustedOrigin } from './request-origin'
export async function adminSession() {
  const db = await createClient('admin')
  const { data: { user }, error } = await db.auth.getUser()
  if (error || !user) return null
  const { data: profile, error: profileError } = await db.from('profiles').select('role').eq('user_id', user.id).single()
  if (profileError || !['admin', 'super_admin'].includes(profile?.role)) return null
  return { db, user, role: profile.role as 'admin' | 'super_admin' }
}
export async function isAdmin() { return Boolean(await adminSession()) }
export const sameOrigin = isTrustedOrigin

