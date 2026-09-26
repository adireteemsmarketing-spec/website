'use client'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Customer } from '@/lib/customer-types'
type State = { customer: Customer | null; loaded: boolean; error: string; refresh: () => Promise<void>; signOut: () => Promise<void> }
const Context = createContext<State | null>(null)
export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loaded, setLoaded] = useState(false), [error, setError] = useState('')
  const requestVersion = useRef(0)
  const refresh = useCallback(async () => {
    const version = ++requestVersion.current
    try { const r = await fetch('/api/customer', { cache: 'no-store' }); const data = await r.json(); if (!r.ok) throw Error(data.error); if (version === requestVersion.current) { setCustomer(data.customer); setError('') } }
    catch (e) { if (version === requestVersion.current) setError((e as Error).message) } finally { if (version === requestVersion.current) setLoaded(true) }
  }, [])
  useEffect(() => {
    // Supabase emits INITIAL_SESSION on subscription, then subsequent auth changes.
    const { data } = createClient().auth.onAuthStateChange((_event, session) => {
      if (!session) { requestVersion.current++; setCustomer(null); setLoaded(true); setError('') }
      else void refresh()
    })
    window.addEventListener('focus', refresh)
    return () => { data.subscription.unsubscribe(); window.removeEventListener('focus', refresh) }
  }, [refresh])
  async function signOut() { const { error } = await createClient().auth.signOut({ scope: 'local' }); if (error) { setError('Unable to sign out. Please retry.'); return } setCustomer(null); await refresh() }
  return <Context.Provider value={{ customer, loaded, error, refresh, signOut }}>{children}</Context.Provider>
}
export function useCustomer() { const value = useContext(Context); if (!value) throw Error('CustomerProvider is required'); return value }
