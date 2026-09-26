import 'server-only'
import { createClient } from '@supabase/supabase-js'
// Public catalogue queries never inherit an administrator's cookies.
export const createPublicClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

