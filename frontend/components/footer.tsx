'use client'

import Link from 'next/link'
import { Building2, CreditCard, Landmark } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { brand } from '@/lib/brand'

const quickLinks = [
  ['FAQ', '/faq'], ['Order Tracking', '/order'], ['Review', '/reviews'], ['Policy', '/privacy'],
  ['About Us', '/about'], ['Blog', '/blog'], ['Events', '/events'],
]

export function Footer() {
  const pathname = usePathname()

  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) return null

  return (
    <footer className="relative mt-0 bg-[#0d0d0d] text-white">
      <div className="mx-auto grid grid-cols-1 max-w-[1440px] gap-10 px-6 py-16 sm:px-10 lg:grid-cols-[1.35fr_1fr_1fr_0.9fr] lg:gap-16 lg:px-16 lg:py-18">
        <div>
          <Link href="/" className="font-heading text-[25px] font-medium tracking-[-0.03em] transition-colors hover:text-[#e4c158]">ADIRE TEEMS</Link>
          <p className="mt-3 text-sm text-[#e4c158]">{brand.slogan}</p>
          <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#e4c158]">Social media</p>
          <div className="mt-3 flex items-center gap-4 text-[#e4c158]">
            <a href="https://www.facebook.com/Adireteems1" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="grid h-8 w-8 place-items-center transition hover:text-white"><svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.931-1.956 1.887v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" /></svg></a>
            <a href="https://www.instagram.com/adireteems?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid h-8 w-8 place-items-center transition hover:text-white"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg></a>
            <a href="https://x.com/AdireTeems" target="_blank" rel="noopener noreferrer" aria-label="X" className="grid h-8 w-8 place-items-center transition hover:text-white"><svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.64 7.584H.47l8.6-9.835L0 1.154h7.594l5.243 6.932zm-1.29 19.49h2.039L6.487 3.24H4.3z" /></svg></a>
          </div>
          <p className="mt-5 text-sm text-zinc-400">© 2026 ADIRE TEEMS. CRAFTED BY HAND.</p>
        </div>

        <div>
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#e4c158]">Quick links</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">
            {quickLinks.map(([label, href]) => <li key={label}><Link href={href} className="transition hover:text-[#e4c158]">{label}</Link></li>)}
          </ul>
        </div>

        <div>
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#e4c158]">Payment options</h2>
          <ul className="mt-4 space-y-3 text-sm text-zinc-400">
            <li className="flex items-center gap-3"><Building2 className="h-4 w-4 text-[#e4c158]" />Paystack</li>
            <li className="flex items-center gap-3"><CreditCard className="h-4 w-4 text-[#e4c158]" />Cards / ATM</li>
            <li className="flex items-center gap-3"><Landmark className="h-4 w-4 text-[#e4c158]" />Bank transfers</li>
          </ul>
        </div>

        <div>
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#e4c158]">Contact us</h2>
          <address className="mt-4 space-y-2.5 text-sm not-italic leading-5 text-zinc-400">
            {brand.phones.map(phone => <p key={phone.href}><a href={phone.href} className="transition hover:text-[#e4c158]">{phone.label}</a></p>)}
            <p><a href={`mailto:${brand.email}`} className="break-words transition hover:text-[#e4c158]">{brand.email}</a></p>
            <p>{brand.address}</p>
            <p className="pt-1"><Link href="/contact" className="text-[#e4c158] transition hover:text-white">Visit Adire Teems Lounge</Link></p>
          </address>
        </div>
      </div>
      <a href="https://wa.me/2348166243695" target="_blank" rel="noopener noreferrer" aria-label="Chat with Adire Teems on WhatsApp (opens in a new tab)" title="Chat on WhatsApp" className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-6 z-40 grid h-14 w-14 place-items-center rounded-full border border-[#e4c158] bg-[#171717] text-[#e4c158] shadow-lg transition hover:bg-[#e4c158] hover:text-black"><svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7"><path d="M20.52 3.48A11.91 11.91 0 0012.04 0C5.46 0 .1 5.35.1 11.93c0 2.1.55 4.16 1.6 5.97L0 24l6.25-1.64a11.94 11.94 0 005.79 1.48h.01C18.63 23.84 24 18.49 24 11.91a11.85 11.85 0 00-3.48-8.43zM12.05 21.83a9.9 9.9 0 01-5.04-1.38l-.36-.21-3.71.97.99-3.61-.24-.37a9.9 9.9 0 01-1.52-5.3c0-5.47 4.45-9.92 9.93-9.92a9.86 9.86 0 017.02 2.91 9.86 9.86 0 012.91 7.02c0 5.47-4.46 9.89-9.98 9.89zm5.45-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.21 3.09c.15.2 2.11 3.22 5.12 4.52.72.31 1.28.5 1.72.64.72.23 1.37.2 1.89.12.58-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" /></svg></a>
    </footer>
  )
}
