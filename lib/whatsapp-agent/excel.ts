import type { WhatsappAgentConfig } from '@/lib/whatsapp-agent/config'
import type { WaOrderRecord } from '@/lib/whatsapp-agent/types'

function productSummary(items: WaOrderRecord['items']) {
  return items
    .map(
      (item) =>
        `${item.product_name}${item.variant ? ` (${item.variant})` : ''} x${item.quantity}`,
    )
    .join('; ')
}

export function mapOrderToExcelRow(order: WaOrderRecord) {
  return [
    order.order_id,
    order.created_at,
    order.customer_name,
    order.whatsapp_id,
    order.alternate_phone || '',
    order.delivery_area,
    order.landmark || '',
    order.latitude ?? '',
    order.longitude ?? '',
    order.location_url || '',
    productSummary(order.items),
    order.items.reduce((sum, item) => sum + item.quantity, 0),
    order.subtotal_ghs,
    order.delivery_fee_ghs,
    order.total_ghs,
    order.payment_method,
    order.payment_status,
    order.order_status,
    order.notes || '',
    'Synced',
  ]
}

async function responseJson(response: Response, label: string) {
  const text = await response.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = { raw: text }
  }
  if (!response.ok) {
    throw new Error(`${label} failed (${response.status}): ${JSON.stringify(body)}`)
  }
  return body
}

async function refreshMicrosoftAccessToken(
  settings: WhatsappAgentConfig['microsoft'],
) {
  if (settings.accessToken) return settings.accessToken
  const body = new URLSearchParams({
    client_id: settings.clientId,
    client_secret: settings.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: settings.refreshToken,
    scope: 'https://graph.microsoft.com/.default offline_access',
  })
  const response = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(settings.tenantId)}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(30_000),
    },
  )
  const token = (await responseJson(response, 'Microsoft OAuth refresh')) as {
    access_token: string
  }
  return token.access_token
}

export async function appendOrderToExcel(
  order: WaOrderRecord,
  settings: WhatsappAgentConfig['microsoft'],
) {
  const accessToken = await refreshMicrosoftAccessToken(settings)
  const drivePath = settings.driveId
    ? `drives/${encodeURIComponent(settings.driveId)}`
    : 'me/drive'
  const endpoint = `https://graph.microsoft.com/v1.0/${drivePath}/items/${encodeURIComponent(
    settings.driveItemId,
  )}/workbook/tables/${encodeURIComponent(settings.tableName)}/rows`
  const response = await fetch(endpoint, {
    method: 'POST',
    signal: AbortSignal.timeout(30_000),
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ values: [mapOrderToExcelRow(order)] }),
  })
  return responseJson(response, 'Excel row append')
}
