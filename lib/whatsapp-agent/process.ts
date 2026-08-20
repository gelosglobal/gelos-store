import {
  getWhatsappAgentConfig,
  getWhatsappAgentReadiness,
  type WhatsappAgentConfig,
} from '@/lib/whatsapp-agent/config'
import { getWhatsappCatalogAsync } from '@/lib/whatsapp-agent/catalog'
import { getWhatsappShop } from '@/lib/whatsapp-agent/shop'
import { WhatsappOrderService } from '@/lib/whatsapp-agent/order-service'
import { createToolRunner, validateStrictToolSchemas } from '@/lib/whatsapp-agent/tools'
import { runOrderAgent } from '@/lib/whatsapp-agent/openai-agent'
import { appendOrderToExcel } from '@/lib/whatsapp-agent/excel'
import {
  extractIncomingMessages,
  markMessageRead,
  sendPaymentMethodButtons,
  sendTextMessage,
  sendVariantPickerList,
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

function digitsOnly(value: string) {
  return String(value || '').replace(/\D/g, '')
}

function isStaffSender(
  whatsappId: string,
  currentConfig: WhatsappAgentConfig,
) {
  const staff = digitsOnly(currentConfig.meta.staffNumber)
  const from = digitsOnly(whatsappId)
  if (!staff || !from) return false
  return from === staff || from.endsWith(staff) || staff.endsWith(from)
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
  eventId?: string | null,
) {
  if (
    !currentConfig.whatsappEnabled ||
    !getWhatsappAgentReadiness(currentConfig).whatsappCredentialsReady
  ) {
    return { sent: false as const, reason: 'whatsapp_not_live' }
  }
  try {
    await sendTextMessage(whatsappId, text, currentConfig.meta)
    await store.markReplySent(eventId)
    return { sent: true as const }
  } catch (error) {
    console.error('[whatsapp-agent] send_reply_failed', {
      customer: customerRef(whatsappId),
      phoneNumberId: currentConfig.meta.phoneNumberId,
      error: error instanceof Error ? error.message : String(error),
    })
    await sendTextMessage(whatsappId, text, currentConfig.meta)
    await store.markReplySent(eventId)
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
    if (source === 'whatsapp') {
      if (await store.wasReplySent(message.id)) {
        return { duplicate: true as const, resent: false as const }
      }
      const latest = await store.getLatestAssistantMessage(message.from)
      const createdAt = latest ? Date.parse(latest.created_at) : NaN
      if (
        latest &&
        Number.isFinite(createdAt) &&
        Date.now() - createdAt < DUPLICATE_RESEND_WINDOW_MS
      ) {
        await sendCustomerReply(
          message.from,
          latest.content,
          currentConfig,
          message.id,
        )
        console.info('[whatsapp-agent] duplicate_resent_assistant_reply', {
          customer: customerRef(message.from),
        })
        return {
          duplicate: true as const,
          resent: true as const,
          text: latest.content,
        }
      }
    }
    return { duplicate: true as const, resent: false as const }
  }

  const catalog = await getWhatsappCatalogAsync()
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
      await sendCustomerReply(message.from, text, currentConfig, message.id)
    }
    return { text, events: [], setupRequired: ['OPENAI_API_KEY'] }
  }

  const conversation = await store.getConversation(message.from, 20)
  const liveWhatsapp =
    source === 'whatsapp' &&
    currentConfig.whatsappEnabled &&
    getWhatsappAgentReadiness(currentConfig).whatsappCredentialsReady

  const runTool = createToolRunner({
    orderService,
    whatsappId: message.from,
    rawCustomerMessage: message.text,
    offerVariantPicker: liveWhatsapp
      ? async (productId, bodyText) => {
          const product = catalog.resolve(productId) || catalog.get(productId)
          if (!product) {
            return { sent: false, error: `Unknown product: ${productId}` }
          }
          if (!product.variants?.length) {
            return {
              sent: false,
              error: `${product.name} has no variants to pick.`,
            }
          }
          await sendVariantPickerList(
            message.from,
            {
              productId: product.id,
              productName: product.name,
              variants: product.variants,
              bodyText: bodyText || undefined,
            },
            currentConfig.meta,
          )
          return {
            sent: true,
            product_id: product.id,
            variant_count: product.variants.length,
            note: 'WhatsApp list sent. Wait for the customer list reply before set_cart_items.',
          }
        }
      : undefined,
    offerPaymentButtons: liveWhatsapp
      ? async () => {
          await sendPaymentMethodButtons(message.from, currentConfig.meta)
          return {
            sent: true,
            note: 'Payment buttons sent. Wait for the customer tap before set_payment_method.',
          }
        }
      : undefined,
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

  if (source === 'whatsapp') {
    await sendCustomerReply(
      message.from,
      result.text,
      currentConfig,
      message.id,
    )
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
      if (isStaffSender(message.from, currentConfig)) {
        console.info('[whatsapp-agent] staff_message_ignored', {
          customer: customerRef(message.from),
        })
        if (
          currentConfig.whatsappEnabled &&
          getWhatsappAgentReadiness(currentConfig).whatsappCredentialsReady
        ) {
          await sendTextMessage(
            message.from,
            'This chat is for Gelos order/handoff alerts only. Customer orders happen in separate chats — I won’t take staff messages as orders here.',
            currentConfig.meta,
          ).catch((error) =>
            console.warn('[whatsapp-agent] staff_ack_failed', { error }),
          )
        }
        continue
      }

      const result = await processIncomingMessage(message, {
        source: 'whatsapp',
        config: currentConfig,
      })
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
