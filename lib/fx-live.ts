import { applyUsdPivotRates } from '@/lib/exchange-rates'

type OpenErResponse = {
  result?: string
  rates?: Record<string, number>
}

let cachedUsdRates: Record<string, number> | null = null
let cachedAt = 0
const CACHE_TTL_MS = 6 * 60 * 60 * 1000

function isPublicIp(ip: string): boolean {
  if (!ip) return false
  if (ip === '::1' || ip === '127.0.0.1') return false
  if (ip.startsWith('10.')) return false
  if (ip.startsWith('192.168.')) return false
  if (ip.startsWith('172.')) {
    const second = Number(ip.split('.')[1])
    if (second >= 16 && second <= 31) return false
  }
  if (ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) {
    return false
  }
  return true
}

export function clientIpFromHeaders(headers: Headers): string | undefined {
  const forwarded = headers.get('x-forwarded-for')
  const ip =
    forwarded?.split(',')[0]?.trim() ||
    headers.get('x-real-ip')?.trim() ||
    ''
  return ip || undefined
}

/** USD → local units. Cached; fails open to static pivot rates. */
export async function fetchUsdToLocalRates(): Promise<Record<string, number>> {
  if (cachedUsdRates && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedUsdRates
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 2500)

  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal,
    })
    if (!response.ok) return cachedUsdRates ?? {}
    const data = (await response.json()) as OpenErResponse
    if (data.result !== 'success' || !data.rates) return cachedUsdRates ?? {}
    cachedUsdRates = data.rates
    cachedAt = Date.now()
    return data.rates
  } catch {
    return cachedUsdRates ?? {}
  } finally {
    clearTimeout(timer)
  }
}

export async function ratesFromUsdPivot(
  ghsToUsd: number,
): Promise<Record<string, number>> {
  const usdToLocal = await fetchUsdToLocalRates()
  return applyUsdPivotRates({ GHS: 1, USD: ghsToUsd }, usdToLocal)
}

export { isPublicIp }
