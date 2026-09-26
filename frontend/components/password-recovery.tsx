'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { closeRecoverySession, createRecoveryClient, openRecoverySession } from '@/lib/supabase/recovery'

export function ForgotPassword() {
  const [busy, setBusy] = useState(false), [sent, setSent] = useState(false), [message, setMessage] = useState('')
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return
    const email = String(new FormData(event.currentTarget).get('email') || '').trim()
    setBusy(true); setMessage('')
    try {
      const { error } = await createRecoveryClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
      if (error) throw Error(error.status === 429 ? 'Too many requests. Please wait a few minutes before trying again.' : 'We could not send the reset email. Please try again shortly or contact support.')
      setSent(true)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to send the reset email. Please retry.') }
    finally { setBusy(false) }
  }
  return <section className="store-shell max-w-xl"><h1 className="mb-6 font-heading text-4xl">Forgot your password?</h1>
    <div className="store-panel">
      {sent ? <div role="status"><h2 className="text-xl">Check your email</h2><p className="mt-4 leading-7">If an account exists for that email, you will receive a link to choose a new password. Check your spam folder too.</p><button className="mt-5 underline" onClick={() => setSent(false)}>Try another email or request a new link</button></div>
        : <form onSubmit={submit} className="space-y-5"><p>Enter your account email. We will send you a secure password reset link.</p><label className="block">Email address<input name="email" type="email" autoComplete="email" required maxLength={254} disabled={busy} className="mt-2 w-full border border-zinc-500 bg-black p-3 text-white" /></label><button disabled={busy} className="store-primary disabled:opacity-50">{busy ? 'Sending...' : 'Send reset link'}</button>{message && <p role="alert">{message}</p>}</form>}
    </div><div className="mt-6 flex gap-6"><Link className="underline" href="/dashboard">Customer sign in</Link><Link className="underline" href="/admin">Admin sign in</Link></div>
  </section>
}

export function ResetPassword() {
  const [state, setState] = useState({ ready: false, email: '', error: '' })
  const [busy, setBusy] = useState(false), [done, setDone] = useState(false), [message, setMessage] = useState('')
  const opening = useRef<Promise<string> | null>(null)
  useEffect(() => {
    let active = true
    // Strict Mode may run this effect twice. Consume the single-use link only once.
    opening.current ||= openRecoverySession()
    opening.current.then(email => { if (active) setState({ ready: true, email, error: '' }) }).catch(error => { if (active) setState({ ready: false, email: '', error: error.message }) })
    return () => { active = false }
  }, [])
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return
    const form = new FormData(event.currentTarget), password = String(form.get('password') || '')
    if (password.length < 8) { setMessage('Use at least 8 characters.'); return }
    if (password !== form.get('confirm')) { setMessage('The passwords do not match. Please check them.'); return }
    setBusy(true); setMessage('')
    try {
      // Recheck the recovery session; a normal customer/admin login is never used here.
      await openRecoverySession()
      const { error } = await createRecoveryClient().auth.updateUser({ password })
      if (error) throw Error(error.code === 'same_password' ? 'Choose a password different from your previous password.' : error.code === 'weak_password' ? 'Choose a stronger password and try again.' : 'Unable to update your password. Request a new reset link if this one has expired.')
      setDone(true)
      await closeRecoverySession().catch(() => {})
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to change your password.') }
    finally { setBusy(false) }
  }
  return <section className="store-shell max-w-xl"><h1 className="mb-6 font-heading text-4xl">Choose a new password</h1><div className="store-panel">
    {done ? <div role="status"><h2 className="text-xl">Password changed</h2><p className="mt-4">You can now sign in with your new password.</p><div className="mt-6 flex gap-6"><Link className="underline" href="/dashboard">Customer sign in</Link><Link className="underline" href="/admin">Admin sign in</Link></div></div>
      : state.error ? <p role="alert">{state.error}</p> : !state.ready ? <p role="status">Checking your reset link...</p>
        : <form onSubmit={submit} className="space-y-5"><p className="break-all">Reset password for {state.email}</p><label className="block">New password<input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required disabled={busy} className="mt-2 w-full border border-zinc-500 bg-black p-3 text-white" /></label><p className="text-sm text-zinc-300">Use at least 8 characters.</p><label className="block">Confirm new password<input name="confirm" type="password" autoComplete="new-password" minLength={8} maxLength={128} required disabled={busy} className="mt-2 w-full border border-zinc-500 bg-black p-3 text-white" /></label><button disabled={busy} className="store-primary disabled:opacity-50">{busy ? 'Saving...' : 'Save new password'}</button>{message && <p role="alert">{message}</p>}</form>}
    {!done && <Link className="mt-6 block underline" href="/forgot-password">Request a new reset link</Link>}
  </div></section>
}
