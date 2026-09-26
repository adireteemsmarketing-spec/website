import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { adminCookieName } from './session-scope'

export const createClient = async (scope: 'customer' | 'admin' = 'customer') => {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      ...(scope === 'admin' ? { cookieOptions: { name: adminCookieName(process.env.NEXT_PUBLIC_SUPABASE_URL!), httpOnly: true, sameSite: 'lax' as const, path: '/' } } : {}),
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Handle errors in server actions
          }
        },
      },
    }
  )
}
