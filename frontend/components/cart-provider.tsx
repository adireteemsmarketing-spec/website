'use client'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { addItem, updateItem, restoreCart, type BagItem } from '@/lib/cart-state'
import { useStore } from './store-provider'
import { useCustomer } from './customer-provider'
type Cart = { items: BagItem[]; ready: boolean; syncError: string; retrySync: () => void; flush: () => Promise<void>; clear: () => void; add: (id: string, size: string, quantity: number) => void; update: (id: string, size: string, quantity: number) => void }
const Context = createContext<Cart | null>(null)
const guestKey = 'adire-teems-cart-v1'
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { products, loaded } = useStore(); const { customer, loaded: accountLoaded } = useCustomer()
  const owner = customer?.id || 'guest'
  const [state, setState] = useState<{ owner: string; items: BagItem[]; canSave: boolean }>({ owner: '', items: [], canSave: false })
  const [syncError, setSyncError] = useState(''), [retry, setRetry] = useState(0)
  const queue = useRef(Promise.resolve()); const catalogue = useRef(products)
  useEffect(() => { catalogue.current = products }, [products])
  const ready = loaded && accountLoaded && state.owner === owner
  const items = ready ? state.items : []
  useEffect(() => {
    const key = owner === 'guest' ? guestKey : `${guestKey}:${owner}`
    function receive(event: StorageEvent) {
      if (event.key !== key) return
      try {
        const incoming = restoreCart(JSON.parse(event.newValue || '[]'), catalogue.current)
        setState(current => current.owner !== owner || JSON.stringify(current.items) === JSON.stringify(incoming) ? current : { ...current, items: incoming })
      } catch { /* Ignore invalid data from another tab. */ }
    }
    window.addEventListener('storage', receive)
    return () => window.removeEventListener('storage', receive)
  }, [owner])
  useEffect(() => {
    if (!loaded || !accountLoaded) return
    let active = true
    async function load() {
      const key = owner === 'guest' ? guestKey : `${guestKey}:${owner}`
      let local: BagItem[] = [], guest: BagItem[] = [], pending = false
      try { local = restoreCart(JSON.parse(localStorage.getItem(key) || '[]'), catalogue.current); pending = localStorage.getItem(`${key}:pending`) === 'true'; if (owner !== 'guest') guest = restoreCart(JSON.parse(localStorage.getItem(guestKey) || '[]'), catalogue.current) } catch { /* Storage may be disabled. */ }
      let merged = local, canSave = owner === 'guest'
      try {
        if (owner !== 'guest') {
          await queue.current
          const r = await fetch('/api/customer/cart', { cache: 'no-store' }); const data = await r.json(); if (!r.ok) throw Error(data.error)
          merged = pending ? local : restoreCart(data.items, catalogue.current)
          for (const item of guest) merged = addItem(merged, item.productId, item.size, item.quantity, catalogue.current)
          canSave = true
        }
        if (active) setSyncError('')
      } catch (e) { if (active) setSyncError((e as Error).message) }
      if (active) {
        setState({ owner, items: merged, canSave })
        if (owner !== 'guest' && guest.length && canSave) { try { localStorage.setItem(key, JSON.stringify(merged)); localStorage.setItem(`${key}:pending`, 'true'); localStorage.removeItem(guestKey) } catch {} }
      }
    }
    void load(); return () => { active = false }
  }, [owner, loaded, accountLoaded, retry])
  useEffect(() => {
    if (!ready) return
    const key = owner === 'guest' ? guestKey : `${guestKey}:${owner}`
    try { localStorage.setItem(key, JSON.stringify(state.items)); if (owner !== 'guest') localStorage.setItem(`${key}:pending`, 'true') } catch { /* Bag remains available this visit. */ }
    if (owner === 'guest' || !state.canSave) return
    let active = true
    queue.current = queue.current.then(async () => {
      if (!active) return
      try {
        const r = await fetch('/api/customer/cart', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: state.items, owner }) }); const data = await r.json(); if (!r.ok) throw Error(data.error)
        if (active) { setSyncError(''); try { localStorage.removeItem(`${key}:pending`) } catch {} }
      } catch (e) { if (active) setSyncError((e as Error).message) }
    })
    return () => { active = false }
  }, [state, owner, ready])
  const add: Cart['add'] = (id, size, quantity) => { if (ready) setState(current => ({ ...current, items: addItem(current.items, id, size, quantity, products) })) }
  const update: Cart['update'] = (id, size, quantity) => { if (ready) setState(current => ({ ...current, items: updateItem(current.items, id, size, quantity) })) }
  const clear = () => {
    // Persist before leaving for hosted checkout; navigation may precede React's effects.
    const key = owner === 'guest' ? guestKey : `${guestKey}:${owner}`
    try { localStorage.setItem(key, '[]'); if (owner !== 'guest') localStorage.setItem(`${key}:pending`, 'true') } catch { /* The saved order remains on the server. */ }
    setState({ owner, items: [], canSave: true })
  }
  return <Context.Provider value={{ items, ready, syncError, retrySync: () => setRetry(n => n + 1), flush: () => queue.current, clear, add, update }}>{children}</Context.Provider>
}
export function useCart() { const cart = useContext(Context); if (!cart) throw Error('CartProvider is required'); return cart }
