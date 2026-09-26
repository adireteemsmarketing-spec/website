export const currencies = ['USD', 'NGN', 'GBP', 'EUR'] as const
export type Currency = typeof currencies[number]
export type ExchangeRates = { rates: Record<Currency, number>; date: string }
export function validRates(value: unknown): value is ExchangeRates {
  const data = value as ExchangeRates | undefined
  return !!data && /^\d{4}-\d{2}-\d{2}$/.test(data.date) && data.rates?.USD === 1 && currencies.every(code => Number.isFinite(data.rates[code]) && data.rates[code] > 0)
}
export function formatPrice(amount: number, currency: Currency, rate = 1) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency, currencyDisplay: 'code' }).format(amount * rate)
}
