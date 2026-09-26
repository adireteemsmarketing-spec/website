'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { currencies, formatPrice, validRates, type Currency, type ExchangeRates } from '@/lib/currency'

const CurrencyContext = createContext({ currency: 'USD' as Currency, setCurrency: (_value: Currency) => {}, money: (value: number, source = 'USD') => new Intl.NumberFormat('en-NG',{style:'currency',currency:source}).format(value), toUsd: (value:number,source='USD'):number|null => source==='USD'?value:null, available: false, notice: 'Loading exchange rates…' })
export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, select] = useState<Currency>('USD')
  const [data, setData] = useState<ExchangeRates | null>(null)
  const [notice, setNotice] = useState('Loading exchange rates…')
  useEffect(() => {
    let active = true
    async function refresh() {
      let snapshot: ExchangeRates | null = null
      try { const saved = JSON.parse(localStorage.getItem('adire-exchange-rates') || 'null'); if (validRates(saved)) snapshot = saved } catch {}
      try {
        const response = await fetch('/api/exchange-rates')
        const result = await response.json()
        if (!response.ok || !validRates(result)) throw new Error('Unavailable')
        snapshot = result
        try { localStorage.setItem('adire-exchange-rates', JSON.stringify(result)) } catch {}
      } catch {}
      if (!active) return
      if (snapshot) {
        setData(snapshot)
        setNotice(`Approximate conversion · rates dated ${snapshot.date}`)
        try { const saved = localStorage.getItem('adire-currency') as Currency; if (currencies.includes(saved)) select(saved) } catch {}
      } else setNotice('Exchange rates unavailable. Prices shown in their original currency.')
    }
    void refresh()
    const timer = setInterval(refresh, 3600000)
    return () => { active = false; clearInterval(timer) }
  }, [])
  const setCurrency = (value: Currency) => {
    if (value !== 'USD' && !data) return
    select(value)
    try { localStorage.setItem('adire-currency', value) } catch {}
  }
  return <CurrencyContext.Provider value={{ currency, setCurrency, money: (value,source='USD') => { const rate=data?.rates[source as Currency]; return rate ? formatPrice(value,currency,data!.rates[currency]/rate) : new Intl.NumberFormat('en-NG',{style:'currency',currency:source}).format(value) }, toUsd: (value,source='USD') => source==='USD'?value:data?.rates[source as Currency]?value/data.rates[source as Currency]:null, available: !!data, notice }}>{children}</CurrencyContext.Provider>
}
export const useCurrency = () => useContext(CurrencyContext)
export function CurrencySelector() {
  const { currency, setCurrency, available, notice } = useCurrency()
  return <div className="flex flex-wrap items-center gap-3 text-xs"><label className="flex items-center gap-2 text-zinc-300">Currency<select aria-label="Display currency" value={currency} onChange={event => setCurrency(event.target.value as Currency)} className="rounded border border-zinc-600 bg-[#171717] p-2 text-[#e4c158]">{currencies.map(code => <option key={code} value={code} disabled={code !== 'USD' && !available}>{code}</option>)}</select></label><span className="text-zinc-400" role="status">{notice}</span></div>
}
