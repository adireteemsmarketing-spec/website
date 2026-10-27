'use client'
import { PasswordInput } from './password-input'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { customerReturnPath } from '@/lib/supabase/oauth'
import { useCustomer } from './customer-provider'
export function CustomerSignIn() {
  const { refresh } = useCustomer()
  const [register, setRegister] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('')
  async function signInWithGoogle() {
    setBusy(true); setMessage('')
    try {
      const callback = new URL('/auth/callback', window.location.origin)
      callback.searchParams.set('next', customerReturnPath(window.location.pathname))
      const { data, error } = await createClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callback.href, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
      })
      if (error) throw error
      if (!data.url) throw Error('Unable to open Google sign-in. Please try again.')
      window.location.assign(data.url)
    } catch {
      setMessage('Google sign-in is unavailable right now. Please try again or use your email and password.')
      setBusy(false)
    }
  }
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
  return <section className="my-6 rounded-lg border border-zinc-300 bg-white p-6 text-zinc-900"><h2 className="font-heading text-2xl">{register ? 'Create your customer account' : 'Sign in to your account'}</h2><p className="my-3 text-sm">Save your bag across devices and follow your orders from preparation to delivery.</p><button type="button" disabled={busy} onClick={() => void signInWithGoogle()} className="mb-4 flex w-full max-w-xl items-center justify-center gap-3 rounded border border-zinc-400 bg-white px-5 py-3 font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-50"><svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.9h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.9 6.1-15.1Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20.4 20.4 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.6 27.5a12.3 12.3 0 0 1 0-7V15H5.8a20 20 0 0 0 0 18l6.8-5.5Z"/><path fill="#EA4335" d="M24 12.1c3 0 5.6 1 7.7 3l5.8-5.8A19.6 19.6 0 0 0 24 4 20.4 20.4 0 0 0 5.8 15l6.8 5.5c1.6-4.8 6.1-8.4 11.4-8.4Z"/></svg>Continue with Google</button><p className="mb-4 max-w-xl text-center text-sm text-zinc-500">or use your email</p><form onSubmit={submit} className="grid max-w-xl gap-4">{register && <label>Full name<input name="name" required maxLength={150} autoComplete="name" className="mt-1 block w-full border p-3" /></label>}<label>Email<input name="email" type="email" required autoComplete="email" className="mt-1 block w-full border p-3" /></label><label>Password<PasswordInput name="password"  required minLength={register ? 8 : undefined} autoComplete={register ? 'new-password' : 'current-password'} className="mt-1 block w-full border p-3" /></label><button disabled={busy} className="bg-black px-5 py-3 text-white disabled:opacity-50">{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}</button><p role="status">{message}</p>{!register && <Link href="/forgot-password" className="text-sm underline">Forgot password?</Link>}</form><button className="mt-4 text-sm underline" onClick={() => { setRegister(!register); setMessage('') }}>{register ? 'Already have an account? Sign in' : 'New here? Create an account'}</button></section>
}
