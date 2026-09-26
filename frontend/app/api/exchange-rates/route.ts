import { validRates, type ExchangeRates } from '@/lib/currency'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const file = path.join(process.cwd(), '.store-data', 'exchange-rates.json')
let pending: Promise<ExchangeRates> | undefined
async function refresh(): Promise<ExchangeRates> {
  const response = await fetch('https://api.frankfurter.dev/v2/rates?base=USD&quotes=NGN,GBP,EUR', { next: { revalidate: 3600 }, signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error('Rates unavailable')
  const rows: { base: string; quote: string; rate: number; date: string }[] = await response.json()
  const data = { rates: { USD: 1 }, date: rows.map(row => row.date).sort()[0] } as ExchangeRates
  for (const code of ['NGN', 'GBP', 'EUR'] as const) {
    const row = rows.find(row => row.base === 'USD' && row.quote === code)
    if (row) data.rates[code] = row.rate
  }
  if (!validRates(data)) throw new Error('Invalid rates')
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(data), 'utf8')
  return data
}
export async function GET() {
  try {
    pending ??= refresh().finally(() => { pending = undefined })
    return Response.json({ ...await pending, cached: false })
  } catch {
    try {
      const data = JSON.parse(await readFile(file, 'utf8'))
      if (validRates(data)) return Response.json({ ...data, cached: true })
    } catch {}
    return Response.json({ error: 'Exchange rates are temporarily unavailable. Prices are shown in USD.' }, { status: 503 })
  }
}
