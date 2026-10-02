'use client'

import Link from 'next/link'
import { ShoppingCart, Search, User, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { CurrencySelector } from './currency-provider'
import { useCart } from './cart-provider'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { items } = useCart()
  const count = items.reduce((sum, item) => sum + item.quantity, 0)

  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) return null

  return (
    <header className="sticky top-0 z-40 w-full bg-black border-b border-gray-800">
      <div className="px-4 py-4 md:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <Link onClick={() => setMobileMenuOpen(false)} href="/" className="flex items-center gap-2">
            <img src="https://pub-e9f6f8fe38ed4236ada6962783ff638d.r2.dev/actions/63b9a8c7-3250-41cd-98a9-1a26b4b5602f" alt="" className="hidden h-12 w-20 object-contain sm:block" />
            <div className="whitespace-nowrap text-xl sm:text-2xl font-bold font-heading text-white">
              Adire Teems
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link onClick={() => setMobileMenuOpen(false)}
              href="/shop" 
              className="text-sm font-medium text-white hover:text-[#E4C158] transition-colors relative group"
            >
              Shop
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#E4C158] scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            </Link>
            <Link onClick={() => setMobileMenuOpen(false)}
              href="/about" 
              className="text-sm font-medium text-white hover:text-[#E4C158] transition-colors relative group"
            >
              About
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#E4C158] scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            </Link>
            <Link onClick={() => setMobileMenuOpen(false)}
              href="/blog" 
              className="text-sm font-medium text-white hover:text-[#E4C158] transition-colors relative group"
            >
              Blog
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#E4C158] scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            </Link>
            <Link onClick={() => setMobileMenuOpen(false)}
              href="/faq" 
              className="text-sm font-medium text-white hover:text-[#E4C158] transition-colors relative group"
            >
              FAQ
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#E4C158] scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            </Link>
            <Link onClick={() => setMobileMenuOpen(false)}
              href="/contact" 
              className="text-sm font-medium text-white hover:text-[#E4C158] transition-colors relative group"
            >
              Contact
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#E4C158] scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-4">
            <Link onClick={() => setMobileMenuOpen(false)} href="/shop#search" aria-label="Search the collection" className="p-2 hover:bg-gray-900 rounded-lg transition-colors text-white">
              <Search className="w-5 h-5" />
            </Link>
            <Link onClick={() => setMobileMenuOpen(false)} href="/dashboard" className="p-2 hover:bg-gray-900 rounded-lg transition-colors text-white">
              <User className="w-5 h-5" />
            </Link>
            <Link onClick={() => setMobileMenuOpen(false)} href="/cart" aria-label={`Shopping bag, ${count} items`} className="p-2 hover:bg-gray-900 rounded-lg transition-colors text-white relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-4 h-4 bg-[#E4C158] text-black text-xs font-bold rounded-full flex items-center justify-center">
                {count}
              </span>
            </Link>
            <button 
              type="button" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-900 rounded-lg transition-colors text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {pathname === '/shop' && (
          <div className="mt-3 border-t border-zinc-800 pt-3"><CurrencySelector /></div>
        )}
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav id="mobile-navigation" aria-label="Mobile navigation" className="lg:hidden mt-4 flex flex-col gap-3 border-t border-gray-800 pt-4">
            <Link onClick={() => setMobileMenuOpen(false)}
              href="/shop" 
              className="text-sm font-medium text-white hover:text-[#E4C158] transition-colors py-2 px-2 rounded hover:bg-gray-900"
            >
              Shop
            </Link>
            <Link onClick={() => setMobileMenuOpen(false)}
              href="/about" 
              className="text-sm font-medium text-white hover:text-[#E4C158] transition-colors py-2 px-2 rounded hover:bg-gray-900"
            >
              About
            </Link>
            <Link onClick={() => setMobileMenuOpen(false)}
              href="/blog" 
              className="text-sm font-medium text-white hover:text-[#E4C158] transition-colors py-2 px-2 rounded hover:bg-gray-900"
            >
              Blog
            </Link>
            <Link onClick={() => setMobileMenuOpen(false)}
              href="/faq" 
              className="text-sm font-medium text-white hover:text-[#E4C158] transition-colors py-2 px-2 rounded hover:bg-gray-900"
            >
              FAQ
            </Link>
            <Link onClick={() => setMobileMenuOpen(false)}
              href="/contact" 
              className="text-sm font-medium text-white hover:text-[#E4C158] transition-colors py-2 px-2 rounded hover:bg-gray-900"
            >
              Contact
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
