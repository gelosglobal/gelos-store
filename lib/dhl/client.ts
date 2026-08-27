import { dhlAuthHeader, getDhlConfig } from '@/lib/dhl/config'
import { messageReference } from '@/lib/dhl/text'

export class DhlApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = 'DhlApiError'
    this.status = status
    this.detail = detail
  }
}

type DhlErrorBody = {
  detail?: string
  message?: string
  title?: string
  reasons?: Array<{ msg?: string }>
  additionalDetails?: string[]
}

function errorMessage(json: DhlErrorBody, status: number): string {
  const extra = json.additionalDetails?.filter(Boolean).join('; ')
  const base =
    json.reasons?.[0]?.msg ||
    json.detail ||
    json.message ||
    json.title ||
    `DHL request failed (${status})`
  return extra ? `${base}: ${extra}` : base
}

export async function dhlFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const config = getDhlConfig()
  const url = `${config.baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  const headers = new Headers(init.headers)
  headers.set('Authorization', dhlAuthHeader(config.apiKey, config.apiSecret))
  headers.set('Accept', 'application/json')
  headers.set('Message-Reference', messageReference())
  headers.set('Message-Reference-Date', new Date().toUTCString())
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...init,
    headers,
    cache: 'no-store',
  })

  if (response.status === 204) {
    return undefined as T
  }

  const json = (await response.json().catch(() => ({}))) as T & DhlErrorBody

  if (!response.ok) {
    const detail = errorMessage(json, response.status)
    if (response.status === 401) {
      throw new DhlApiError(
        response.status,
        `${detail}. Check DHL_API_KEY / DHL_API_SECRET (MyDHL API username and password), and set DHL_ENV=test or production to match those credentials.`,
      )
    }
    throw new DhlApiError(response.status, detail)
  }

  return json
}
