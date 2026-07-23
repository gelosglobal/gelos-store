import { createHash } from 'crypto'
import type { CheckoutLineItem } from '@/lib/checkout'
import { getPublicAppUrl } from '@/lib/env'

/**
 * Meta Conversions API (server-side events for Events Manager).
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

const GRAPH_API_VERSION = 'v21.0'

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Meta requires event_source_url for website CAPI events (attribution/optimization).
 * Prefer an explicit browser URL, then Referer, then app origin + path.
 */
export function resolveEventSourceUrl(
  request?: Request,
  fallbackPath = '/',
  explicit?: string,
): string {
  const trimmed = explicit?.trim()
  if (trimmed && isHttpUrl(trimmed)) return trimmed

  const referer = request?.headers.get('referer')?.trim()
  if (referer && isHttpUrl(referer)) return referer

  const originHeader = request?.headers.get('origin')?.trim()
  const base = (
    originHeader && isHttpUrl(originHeader) ? originHeader : getPublicAppUrl()
  ).replace(/\/$/, '')
  const path = fallbackPath.startsWith('/') ? fallbackPath : `/${fallbackPath}`
  return `${base}${path}`
}

function getPixelId(): string | undefined {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || undefined
}

function getAccessToken(): string | undefined {
  return process.env.META_CONVERSIONS_API_ACCESS_TOKEN?.trim() || undefined
}

function getTestEventCode(): string | undefined {
  return process.env.META_TEST_EVENT_CODE?.trim() || undefined
}

export function isMetaCapiConfigured(): boolean {
  return Boolean(getPixelId() && getAccessToken())
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function hashEmail(email: string | undefined): string | undefined {
  const normalized = email?.trim().toLowerCase()
  return normalized ? sha256(normalized) : undefined
}

/** Meta expects digits only with country code, e.g. 233539621338. */
function hashPhone(
  phone: string | undefined,
  locationId?: string,
): string | undefined {
  const digits = normalizePhoneDigits(phone, locationId)
  return digits ? sha256(digits) : undefined
}

function normalizePhoneDigits(
  phone: string | undefined,
  locationId?: string,
): string | undefined {
  let digits = phone?.replace(/\D/g, '') ?? ''
  if (!digits) return undefined

  const dialCodes: Record<string, string> = {
    ghana: '233',
    nigeria: '234',
    usa: '1',
  }
  const cc = locationId ? dialCodes[locationId] : undefined
  if (cc) {
    if (digits.startsWith('0') && !digits.startsWith(cc)) {
      digits = `${cc}${digits.slice(1)}`
    } else if (!digits.startsWith(cc) && digits.length <= 10) {
      digits = `${cc}${digits}`
    }
  }

  return digits
}

function hashName(name: string | undefined): string | undefined {
  const normalized = name?.trim().toLowerCase()
  return normalized ? sha256(normalized) : undefined
}

function hashCountry(locationId: string | undefined): string | undefined {
  const map: Record<string, string> = {
    ghana: 'gh',
    nigeria: 'ng',
    usa: 'us',
    international: 'us',
  }
  const code = locationId ? map[locationId] : undefined
  return code ? sha256(code) : undefined
}

/** Infer market from order currency when locationId was not stored. */
export function locationIdFromCurrency(
  currency: string | undefined,
): string | undefined {
  const code = currency?.trim().toUpperCase()
  if (code === 'GHS') return 'ghana'
  if (code === 'NGN') return 'nigeria'
  if (code === 'USD') return 'usa'
  return undefined
}

export type CapiUserData = {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  /** Storefront market, e.g. 'ghana' — mapped to a country code */
  locationId?: string
  externalId?: string
  city?: string
  state?: string
  zip?: string
  /** YYYYMMDD — only send when actually collected */
  dateOfBirth?: string
  clientIpAddress?: string
  clientUserAgent?: string
  fbp?: string
  fbc?: string
}

/**
 * Best-effort city / state / zip from freeform delivery address.
 * Used to improve Meta EMQ — never invents values that aren't in the text.
 */
export function parseAddressHints(
  address: string | undefined,
  locationId?: string,
): Pick<CapiUserData, 'city' | 'state' | 'zip'> {
  const text = address?.trim()
  if (!text) return {}

  const hints: Pick<CapiUserData, 'city' | 'state' | 'zip'> = {}

  const zipMatch = text.match(/\b(\d{5})(?:-\d{4})?\b/)
  if (zipMatch?.[1]) hints.zip = zipMatch[1]

  const cityStateZip = text.match(
    /,\s*([^,0-9][^,]*?)\s*,\s*([A-Za-z]{2})\s+(\d{5})\b/,
  )
  if (cityStateZip) {
    hints.city = cityStateZip[1]?.trim()
    hints.state = cityStateZip[2]?.toUpperCase()
    hints.zip = cityStateZip[3]
    return hints
  }

  const stateZip = text.match(/\b([A-Za-z]{2})\s+(\d{5})\b/)
  if (stateZip) {
    hints.state = stateZip[1]?.toUpperCase()
    hints.zip = stateZip[2]
  }

  const parts = text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  if (!hints.city && parts.length >= 2) {
    // Prefer the segment before state/zip / last non-numeric segment.
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      const part = parts[i]
      if (!part || /\d/.test(part)) continue
      if (/^(ghana|nigeria|usa|united states|international)$/i.test(part)) {
        continue
      }
      if (hints.state && part.toUpperCase() === hints.state) continue
      hints.city = part
      break
    }
  }

  // US-style: require 2-letter state; skip inventing state for GH/NG markets.
  if (hints.state && hints.state.length !== 2) {
    delete hints.state
  }
  if (locationId && locationId !== 'usa' && locationId !== 'international') {
    // Keep city/zip if present; state codes are US-oriented.
    if (hints.state && !/^[A-Z]{2}$/.test(hints.state)) delete hints.state
  }

  return hints
}

function normalizeMetaGeo(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function hashCity(city: string | undefined): string | undefined {
  const normalized = city ? normalizeMetaGeo(city) : ''
  return normalized ? sha256(normalized) : undefined
}

function hashState(state: string | undefined): string | undefined {
  const normalized = state ? normalizeMetaGeo(state) : ''
  return normalized ? sha256(normalized) : undefined
}

function hashZip(zip: string | undefined): string | undefined {
  let normalized = zip?.trim().toLowerCase().replace(/[\s-]/g, '') ?? ''
  if (!normalized) return undefined
  if (/^\d{5}/.test(normalized)) normalized = normalized.slice(0, 5)
  return sha256(normalized)
}

function hashDob(dateOfBirth: string | undefined): string | undefined {
  const digits = dateOfBirth?.replace(/\D/g, '') ?? ''
  if (digits.length !== 8) return undefined
  return sha256(digits)
}

function isIpv4(value: string): boolean {
  const parts = value.split('.')
  if (parts.length !== 4) return false
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false
    const n = Number(part)
    return n >= 0 && n <= 255
  })
}

function isIpv6(value: string): boolean {
  // Loose check — enough to prefer IPv6 over IPv4 for Meta matching.
  return value.includes(':') && !isIpv4(value)
}

/** Strip ports / brackets so Meta gets a clean IP string. */
function cleanClientIp(raw: string): string | undefined {
  let value = raw.trim()
  if (!value) return undefined

  if (value.startsWith('[')) {
    const end = value.indexOf(']')
    if (end > 0) value = value.slice(1, end)
  } else if (isIpv4(value.split(':')[0] ?? '') && value.includes(':')) {
    // IPv4:port
    value = value.split(':')[0] ?? value
  }

  value = value.trim()
  if (!value || value.toLowerCase() === 'unknown') return undefined
  if (!isIpv4(value) && !isIpv6(value)) return undefined
  return value
}

/**
 * Meta prefers IPv6 over IPv4 for the same user (pixel often sees v6 while
 * naive X-Forwarded-For parsing returns v4). Collect candidates and prefer v6.
 */
export function resolveClientIpAddress(request: Request): string | undefined {
  const headerNames = [
    'x-forwarded-for',
    'x-vercel-forwarded-for',
    'cf-connecting-ip',
    'true-client-ip',
    'x-real-ip',
    'x-client-ip',
  ] as const

  const candidates: string[] = []
  for (const name of headerNames) {
    const header = request.headers.get(name)
    if (!header) continue
    for (const part of header.split(',')) {
      const cleaned = cleanClientIp(part)
      if (cleaned) candidates.push(cleaned)
    }
  }

  const ipv6 = candidates.find(isIpv6)
  if (ipv6) return ipv6
  return candidates[0]
}

/** Extract IP, user agent, and Meta browser cookies from a storefront request. */
export function capiUserDataFromRequest(request: Request): Partial<CapiUserData> {
  const clientIpAddress = resolveClientIpAddress(request)
  const clientUserAgent = request.headers.get('user-agent') ?? undefined

  const cookies = request.headers.get('cookie') ?? ''
  const readCookie = (name: string): string | undefined => {
    const match = cookies.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
    return match?.[1] ? decodeURIComponent(match[1]) : undefined
  }

  return {
    clientIpAddress,
    clientUserAgent,
    fbp: readCookie('_fbp'),
    fbc: readCookie('_fbc'),
  }
}

function buildUserData(user: CapiUserData): Record<string, unknown> {
  const [firstName, ...rest] = (user.firstName ?? '').trim().split(/\s+/)
  const lastNameFromFirst = rest.join(' ')
  const lastName = user.lastName ?? (lastNameFromFirst || undefined)

  const data: Record<string, unknown> = {}
  const em = hashEmail(user.email)
  const ph = hashPhone(user.phone, user.locationId)
  const fn = hashName(firstName)
  const ln = hashName(lastName)
  const country = hashCountry(user.locationId)
  const ct = hashCity(user.city)
  const st = hashState(user.state)
  const zp = hashZip(user.zip)
  const db = hashDob(user.dateOfBirth)

  if (em) data.em = [em]
  if (ph) data.ph = [ph]
  if (fn) data.fn = [fn]
  if (ln) data.ln = [ln]
  if (country) data.country = [country]
  if (ct) data.ct = [ct]
  if (st) data.st = [st]
  if (zp) data.zp = [zp]
  if (db) data.db = [db]
  if (user.externalId) data.external_id = [sha256(user.externalId.trim())]
  if (user.clientIpAddress) data.client_ip_address = user.clientIpAddress
  if (user.clientUserAgent) data.client_user_agent = user.clientUserAgent
  if (user.fbp) data.fbp = user.fbp
  if (user.fbc) data.fbc = user.fbc

  return data
}

export type CapiEventInput = {
  eventName: string
  /** Unique per action — reused by the browser pixel for deduplication. */
  eventId: string
  eventSourceUrl?: string
  userData: CapiUserData
  customData?: Record<string, unknown>
  eventTime?: number
}

/** Send a server event to Meta Events Manager. Never throws. */
export async function sendMetaCapiEvent(input: CapiEventInput): Promise<boolean> {
  const pixelId = getPixelId()
  const accessToken = getAccessToken()
  if (!pixelId || !accessToken) return false

  const event: Record<string, unknown> = {
    event_name: input.eventName,
    event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    action_source: 'website',
    event_source_url: resolveEventSourceUrl(
      undefined,
      '/',
      input.eventSourceUrl,
    ),
    user_data: buildUserData(input.userData),
  }
  if (input.customData) event.custom_data = input.customData

  const body: Record<string, unknown> = { data: [event] }
  const testEventCode = getTestEventCode()
  if (testEventCode) body.test_event_code = testEventCode

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(
        `[meta-capi] ${input.eventName} failed (${res.status})`,
        detail.slice(0, 500),
      )
      return false
    }

    return true
  } catch (error) {
    console.error(`[meta-capi] ${input.eventName} request error`, error)
    return false
  }
}

export type CapiPurchaseInput = {
  orderNumber: string
  total: number
  currency: string
  items: CheckoutLineItem[]
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  locationId?: string
  externalId?: string
  shippingAddress?: string
  /** Browser page URL where the purchase completed (preferred). */
  eventSourceUrl?: string
  request?: Request
}

/** Server-side Purchase — deduped with the browser pixel via order number. */
export async function sendCapiPurchase(input: CapiPurchaseInput): Promise<boolean> {
  if (!isMetaCapiConfigured()) return false

  const requestData = input.request ? capiUserDataFromRequest(input.request) : {}
  const locationId =
    input.locationId ?? locationIdFromCurrency(input.currency)
  const addressHints = parseAddressHints(input.shippingAddress, locationId)
  const value = Number(input.total)
  if (!Number.isFinite(value) || value < 0) return false

  return sendMetaCapiEvent({
    eventName: 'Purchase',
    eventId: input.orderNumber,
    eventSourceUrl: resolveEventSourceUrl(
      input.request,
      '/checkout/success',
      input.eventSourceUrl,
    ),
    userData: {
      email: input.customerEmail,
      phone: input.customerPhone,
      firstName: input.customerName,
      locationId,
      externalId: input.externalId,
      ...addressHints,
      ...requestData,
    },
    customData: {
      value,
      currency: input.currency.toUpperCase(),
      content_type: 'product',
      content_ids: input.items.map((item) => item.id),
      contents: input.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        item_price: item.price,
      })),
      num_items: input.items.reduce((sum, item) => sum + item.quantity, 0),
      order_id: input.orderNumber,
    },
  })
}

export type CapiInitiateCheckoutInput = {
  eventId: string
  total: number
  currency: string
  items: { id: string; quantity: number }[]
  customerEmail?: string
  customerName?: string
  customerPhone?: string
  locationId?: string
  /** Stable shopper id (visitor id) — hashed as external_id for EMQ. */
  externalId?: string
  shippingAddress?: string
  /** Browser page URL where checkout started (preferred). */
  eventSourceUrl?: string
  request?: Request
}

/** Server-side InitiateCheckout from the checkout draft endpoint. */
export async function sendCapiInitiateCheckout(
  input: CapiInitiateCheckoutInput,
): Promise<boolean> {
  if (!isMetaCapiConfigured()) return false

  const requestData = input.request ? capiUserDataFromRequest(input.request) : {}
  const locationId =
    input.locationId ?? locationIdFromCurrency(input.currency)
  const addressHints = parseAddressHints(input.shippingAddress, locationId)
  const value = Number(input.total)
  if (!Number.isFinite(value) || value < 0) return false

  return sendMetaCapiEvent({
    eventName: 'InitiateCheckout',
    eventId: input.eventId,
    eventSourceUrl: resolveEventSourceUrl(
      input.request,
      '/checkout',
      input.eventSourceUrl,
    ),
    userData: {
      email: input.customerEmail,
      phone: input.customerPhone,
      firstName: input.customerName,
      locationId,
      externalId: input.externalId,
      ...addressHints,
      ...requestData,
    },
    customData: {
      value,
      currency: input.currency.toUpperCase(),
      content_type: 'product',
      content_ids: input.items.map((item) => item.id),
      contents: input.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
      num_items: input.items.reduce((sum, item) => sum + item.quantity, 0),
    },
  })
}
