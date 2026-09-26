'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useCustomer } from './customer-provider'
export function CustomerSignIn() {
  const { refresh } = useCustomer()
  const [register, setRegister] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('')
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = new FormData(e.currentTarget); setBusy(true); setMessage('')
    try {
      const db = createClient(); const email = String(form.get('email')).trim(), password = String(form.get('password'))
      const result = register ? await db.auth.signUp({ email, password, options: { data: { full_name: String(form.get('name')).trim() } } }) : await db.auth.signInWithPassword({ email, password })
      if (result.error) throw Error(result.error.message)
      if (register && !result.data.session) setMessage('Check your email to confirm your account, then sign in here.')
      await refresh()
    } catch (e) { setMessage((e as Error).message) } finally { setBusy(false) }
  }
  return <section className="my-6 rounded-lg border border-zinc-300 bg-white p-6 text-zinc-900"><h2 className="font-heading text-2xl">{register ? 'Create your customer account' : 'Sign in to your account'}</h2><p className="my-3 text-sm">Save your bag across devices and follow your orders from preparation to delivery.</p><form onSubmit={submit} className="grid max-w-xl gap-4">{register && <label>Full name<input name="name" required maxLength={150} autoComplete="name" className="mt-1 block w-full border p-3" /></label>}<label>Email<input name="email" type="email" required autoComplete="email" className="mt-1 block w-full border p-3" /></label><label>Password<input name="password" type="password" required minLength={register ? 8 : undefined} autoComplete={register ? 'new-password' : 'current-password'} className="mt-1 block w-full border p-3" /></label><button disabled={busy} className="bg-black px-5 py-3 text-white disabled:opacity-50">{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}</button><p role="status">{message}</p>{!register && <Link href="/forgot-password" className="text-sm underline">Forgot password?</Link>}</form><button className="mt-4 text-sm underline" onClick={() => { setRegister(!register); setMessage('') }}>{register ? 'Already have an account? Sign in' : 'New here? Create an account'}</button></section>
}
