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
  if (!(await store.markEventProcessed(message.id))) {
    return { duplicate: true as const }
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

  if (
    source === 'whatsapp' &&
    currentConfig.whatsappEnabled &&
    getWhatsappAgentReadiness(currentConfig).whatsappCredentialsReady
  ) {
    await sendTextMessage(message.from, result.text, currentConfig.meta)
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
      const result = await processIncomingMessage(message, {
        source: 'whatsapp',
        config: currentConfig,
      })
      console.info('[whatsapp-agent] message_processed', {
        customer: customerRef(message.from),
        duplicate: Boolean(
          result && 'duplicate' in result && result.duplicate,
        ),
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
