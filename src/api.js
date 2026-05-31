// Frankfurter — free, no API key, ECB-backed. https://frankfurter.dev
const BASE = 'https://api.frankfurter.dev/v1'

// In-memory cache so we don't refetch the same pair within a session.
const rateCache = new Map()

export async function getCurrencies() {
  const res = await fetch(`${BASE}/currencies`)
  if (!res.ok) throw new Error('Could not load currency list')
  return res.json() // { USD: "United States Dollar", ... }
}

// Returns { rate, date } where rate is 1 `from` = rate `to`.
export async function getRate(from, to) {
  if (from === to) return { rate: 1, date: null }
  const key = `${from}->${to}`
  if (rateCache.has(key)) return rateCache.get(key)

  const res = await fetch(`${BASE}/latest?base=${from}&symbols=${to}`)
  if (!res.ok) throw new Error('Rate unavailable')
  const data = await res.json()
  const rate = data.rates?.[to]
  if (rate == null) throw new Error('Rate unavailable')

  const result = { rate, date: data.date }
  rateCache.set(key, result)
  return result
}
