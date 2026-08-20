import {
  getWhatsappAgentConfig,
  getWhatsappAgentReadiness,
  type WhatsappAgentConfig,
} from '@/lib/whatsapp-agent/config'
import { getWhatsappCatalog } from '@/lib/whatsapp-agent/catalog'
import { getWhatsappShop } from '@/lib/whatsapp-agent/shop'
import { WhatsappOrderService } from '@/lib/whatsapp-agent/order-service'
import { createToolRunner, validateStrictToolSchemas } from '@/lib/whatsapp-agent/tools'
import { runOrderAgent } from '@/lib/whatsapp-agent/openai-agent'
import { appendOrderToExcel } from '@/lib/whatsapp-agent/excel'
import {
  extractIncomingMessages,
  markMessageRead,
  sendTextMessage,
  type IncomingWhatsappMessage,
} from '@/lib/whatsapp-agent/whatsapp'
import * as store from '@/lib/whatsapp-agent/store'
import type { WaOrderRecord } from '@/lib/whatsapp-agent/types'

const schemaErrors = validateStrictToolSchemas()
if (schemaErrors.length) {
  throw new Error(`Invalid strict tool schemas: ${schemaErrors.join('; ')}`)
}

const DUPLICATE_RESEND_WINDOW_MS = 15 * 60 * 1000

function customerRef(whatsappId: string) {
  const value = String(whatsappId || '')
  return value.length <= 4 ? '****' : `***${value.slice(-4)}`
}

async function notifyStaff(
  text: string,
  currentConfig: WhatsappAgentConfig,
) {
  const readiness = getWhatsappAgentReadiness(currentConfig)
  if (!currentConfig.meta.staffNumber || !readiness.whatsappCredentialsReady) {
    return
  }
  try {
    await sendTextMessage(
      currentConfig.meta.staffNumber,
      text,
      currentConfig.meta,
    )
  } catch (error) {
    console.error('[whatsapp-agent] staff_notification_failed', error)
  }
}

async function syncOrder(
  order: WaOrderRecord,
  currentConfig: WhatsappAgentConfig,
) {
  const readiness = getWhatsappAgentReadiness(currentConfig)
  if (!currentConfig.excelSyncEnabled) return
  if (!readiness.excelCredentialsReady) {
    await store.setExcelSync(
      order.order_id,
      'Configuration required',
      'Microsoft Excel credentials are incomplete.',
    )
    await notifyStaff(
      `Gelos order ${order.order_id} was saved, but Excel sync needs configuration.`,
      currentConfig,
    )
    return
  }
  await store.setExcelSync(order.order_id, 'Syncing')
  try {
    await appendOrderToExcel(order, currentConfig.microsoft)
    await store.setExcelSync(order.order_id, 'Synced')
  } catch (error) {
    await store.setExcelSync(
      order.order_id,
      'Failed',
      error instanceof Error ? error.message : String(error),
    )
    console.error('[whatsapp-agent] excel_sync_failed', {
      orderId: order.order_id,
      error,
    })
    await notifyStaff(
      `Gelos order ${order.order_id} was saved, but Excel sync failed. Check the admin logs.`,
      currentConfig,
    )
  }
}

async function sendCustomerReply(
  whatsappId: string,
  text: string,
  currentConfig: WhatsappAgentConfig,
) {
  if (
    !currentConfig.whatsappEnabled ||
    !getWhatsappAgentReadiness(currentConfig).whatsappCredentialsReady
  ) {
    return { sent: false as const, reason: 'whatsapp_not_live' }
  }
  try {
    await sendTextMessage(whatsappId, text, currentConfig.meta)
    return { sent: true as const }
  } catch (error) {
    console.error('[whatsapp-agent] send_reply_failed', {
      customer: customerRef(whatsappId),
      phoneNumberId: currentConfig.meta.phoneNumberId,
      error: error instanceof Error ? error.message : String(error),
    })
    await sendTextMessage(whatsappId, text, currentConfig.meta)
    return { sent: true as const }
  }
}

export async function processIncomingMessage(
  message: Pick<
    IncomingWhatsappMessage,
    'id' | 'from' | 'displayName' | 'text'
  >,
  {
    source = 'whatsapp',
    config: currentConfig = getWhatsappAgentConfig(),
  }: {
    source?: 'whatsapp' | 'simulation'
    config?: WhatsappAgentConfig
  } = {},
) {
  if (!message.from || !message.text) {
    throw new Error('Incoming message requires from and text.')
  }

  const isNewEvent = await store.markEventProcessed(message.id)
  if (!isNewEvent) {
    // Meta often retries after a timeout. We may have saved the AI reply but
    // died before WhatsApp send — resend the latest assistant text.
    if (source === 'whatsapp') {
      const latest = await store.getLatestAssistantMessage(message.from)
      const createdAt = latest ? Date.parse(latest.created_at) : NaN
      if (
        latest &&
        Number.isFinite(createdAt) &&
        Date.now() - createdAt < DUPLICATE_RESEND_WINDOW_MS
      ) {
        await sendCustomerReply(message.from, latest.content, currentConfig)
        console.info('[whatsapp-agent] duplicate_resent_assistant_reply', {
          customer: customerRef(message.from),
        })
        return { duplicate: true as const, resent: true as const, text: latest.content }
      }
    }
    return { duplicate: true as const, resent: false as const }
  }

  const catalog = getWhatsappCatalog()
  const shop = getWhatsappShop()
  const orderService = new WhatsappOrderService(catalog, shop)

  await store.ensureCustomer(message.from, message.displayName || null)
  await store.saveMessage({
    whatsappId: message.from,
    role: 'user',
    content: message.text,
    externalMessageId: message.id || null,
  })

  if (!currentConfig.openai.apiKey) {
    const text =
      shop.agent_unavailable_message ||
      'The Gelos automated assistant is not configured yet. A team member will help you shortly.'
    await store.saveMessage({
      whatsappId: message.from,
      role: 'assistant',
      content: text,
    })
    if (source === 'whatsapp') {
      await sendCustomerReply(message.from, text, currentConfig)
    }
    return { text, events: [], setupRequired: ['OPENAI_API_KEY'] }
  }

  const conversation = await store.getConversation(message.from, 20)
  const runTool = createToolRunner({
    orderService,
    whatsappId: message.from,
    rawCustomerMessage: message.text,
  })
  const result = await runOrderAgent({
    settings: currentConfig.openai,
    shop,
    conversation,
    runTool,
  })
  await store.saveMessage({
    whatsappId: message.from,
    role: 'assistant',
    content: result.text,
  })

  // Send to WhatsApp before slower side effects (Excel / staff fan-out).
  if (source === 'whatsapp') {
    await sendCustomerReply(message.from, result.text, currentConfig)
  }

  for (const event of result.events) {
    if (event.event === 'order_created' && event.order) {
      const order = event.order as WaOrderRecord
      await syncOrder(order, currentConfig)
      await notifyStaff(
        `New Gelos order ${order.order_id}: ${order.customer_name}, GHS ${order.total_ghs.toFixed(2)}, ${order.delivery_area}.`,
        currentConfig,
      )
    }
    if (event.event === 'handoff_created' && event.handoff) {
      const handoff = event.handoff as {
        urgency: string
        reason: string
      }
      await notifyStaff(
        `Gelos handoff (${handoff.urgency}) for customer ${customerRef(message.from)}: ${handoff.reason}`,
        currentConfig,
      )
    }
  }

  return result
}

export async function handleWebhookPayload(
  payload: Record<string, unknown>,
  currentConfig: WhatsappAgentConfig = getWhatsappAgentConfig(),
) {
  const messages = extractIncomingMessages(payload)
  for (const message of messages) {
    try {
      const result = await processIncomingMessage(message, {
        source: 'whatsapp',
        config: currentConfig,
      })
      // Mark read after reply work so it cannot delay/block the customer send.
      if (
        currentConfig.whatsappEnabled &&
        getWhatsappAgentReadiness(currentConfig).whatsappCredentialsReady
      ) {
        await markMessageRead(message.id, currentConfig.meta).catch((error) =>
          console.warn('[whatsapp-agent] mark_read_failed', {
            customer: customerRef(message.from),
            error,
          }),
        )
      }
      console.info('[whatsapp-agent] message_processed', {
        customer: customerRef(message.from),
        duplicate: Boolean(
          result && 'duplicate' in result && result.duplicate,
        ),
        resent: Boolean(result && 'resent' in result && result.resent),
        events:
          result && 'events' in result
            ? result.events?.map((event) => event.event) || []
            : [],
      })
    } catch (error) {
      console.error('[whatsapp-agent] message_processing_failed', {
        customer: customerRef(message.from),
        error,
      })
      await notifyStaff(
        `Gelos agent failed to process a message from customer ${customerRef(message.from)}.`,
        currentConfig,
      )
    }
  }
}
