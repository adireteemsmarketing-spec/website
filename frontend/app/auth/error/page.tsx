import Link from 'next/link'

export default function AuthErrorPage() {
  return <section className="store-shell max-w-xl">
    <h1 className="font-heading text-3xl">Google sign-in wasn’t completed</h1>
    <p className="my-5">Please try again and choose your Google account. You can also sign in with your email and password.</p>
    <Link href="/dashboard" className="store-primary inline-block">Return to sign in</Link>
    <Link href="/checkout" className="ml-5 underline">Return to checkout</Link>
  </section>
}
