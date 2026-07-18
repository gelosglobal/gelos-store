import {
  getPublicAppUrl,
  getPushAlertApiKey,
  isPushAlertConfigured,
} from '@/lib/env'
import type { OrderEmailData } from '@/lib/email/order-email-data'

const PUSHALERT_SEND_URL =
  'https://api.pushalert.co/rest/v2/web-push/send'

export async function sendAdminNewOrderPush(order: OrderEmailData) {
  if (!isPushAlertConfigured()) {
    return { sent: false as const, reason: 'not_configured' as const }
  }

  const appUrl = getPublicAppUrl()
  const orderUrl = order.orderId
    ? `${appUrl}/admin/orders/${encodeURIComponent(order.orderId)}`
    : `${appUrl}/admin/orders`
  const amount = new Intl.NumberFormat('en', {
    style: 'currency',
    currency: order.currency,
  }).format(order.total)

  const body = new URLSearchParams({
    title: `New order ${order.orderNumber}`,
    message: `${order.customerName} placed a ${amount} order via ${order.channel}.`,
    url: orderUrl,
    icon: `${appUrl}/apple-icon.png`,
    expire_time: '86400',
  })

  try {
    const response = await fetch(PUSHALERT_SEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `api_key=${getPushAlertApiKey()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      cache: 'no-store',
    })
    const result = (await response.json().catch(() => null)) as {
      success?: boolean
      id?: number
      message?: string
    } | null

    if (!response.ok || !result?.success) {
      console.error('[pushalert] Notification failed:', result ?? response.status)
      return {
        sent: false as const,
        reason: 'send_failed' as const,
        error: result,
      }
    }

    return { sent: true as const, id: result.id }
  } catch (error) {
    console.error('[pushalert] Notification failed:', error)
    return { sent: false as const, reason: 'send_failed' as const, error }
  }
}
