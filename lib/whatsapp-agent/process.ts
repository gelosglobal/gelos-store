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
  sendCatalogBrowseMessage,
  sendImageMessage,
  sendMultiProductMessage,
  sendPaymentMethodButtons,
  sendSingleProductMessage,
  sendTextMessage,
  sendVariantPickerList,
  type IncomingWhatsappMessage,
} from '@/lib/whatsapp-agent/whatsapp'
import { isMetaCatalogConfigured } from '@/lib/whatsapp-agent/meta-catalog'
import * as store from '@/lib/whatsapp-agent/store'
import type { WaOrderRecord } from '@/lib/whatsapp-agent/types'
import {
  ensureWhatsappPaystackLink,
  formatPaymentLinkMessage,
  paymentMethodNeedsPaystackLink,
} from '@/lib/whatsapp-agent/payment-link'

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

function formatMoney(value: number) {
  return `GHS ${Number(value).toFixed(2)}`
}

/** Full order card for staff WhatsApp (customer copy + phone + delivery). */
function formatStaffOrderNotification(order: WaOrderRecord) {
  const lines: string[] = [
    `🛒 *New Gelos WhatsApp order*`,
    `Order: *${order.order_id}*`,
    `Status: ${order.order_status} · Payment: ${order.payment_status}`,
    '',
    '*Customer*',
    `Name: ${order.customer_name}`,
    `WhatsApp: ${order.whatsapp_id}`,
  ]
  if (order.alternate_phone) {
    lines.push(`Alt phone: ${order.alternate_phone}`)
  }
  lines.push('', '*Items*')
  for (const item of order.items || []) {
    const variant = item.variant ? ` (${item.variant})` : ''
    const unit =
      item.unit_price_ghs != null ? formatMoney(item.unit_price_ghs) : '—'
    const lineTotal =
      item.line_total_ghs != null ? formatMoney(item.line_total_ghs) : '—'
    lines.push(
      `• ${item.product_name}${variant} ×${item.quantity} @ ${unit} = ${lineTotal}`,
    )
  }
  lines.push(
    '',
    `Subtotal: ${formatMoney(order.subtotal_ghs)}`,
    `Delivery: ${formatMoney(order.delivery_fee_ghs)}`,
    `*Total: ${formatMoney(order.total_ghs)}*`,
    '',
    '*Delivery*',
    `Area: ${order.delivery_area}`,
  )
  if (order.landmark) lines.push(`Landmark: ${order.landmark}`)
  if (
    Number.isFinite(order.latitude) &&
    Number.isFinite(order.longitude) &&
    order.latitude != null &&
    order.longitude != null
  ) {
    lines.push(`Pin: ${order.latitude}, ${order.longitude}`)
  }
  if (order.location_url) lines.push(`Map: ${order.location_url}`)
  lines.push('', '*Payment*', `Method: ${order.payment_method}`)
  if (order.payment_link) {
    lines.push(`Pay link: ${order.payment_link}`)
  }
  if (order.notes) {
    lines.push('', '*Notes*', order.notes)
  }
  lines.push('', `_Reply to the customer on WhatsApp ${order.whatsapp_id}_`)
  return lines.join('\n').slice(0, 4096)
}

async function deliverPaymentLink(
  order: WaOrderRecord,
  currentConfig: WhatsappAgentConfig,
  options?: { forceResend?: boolean },
) {
  const result = await ensureWhatsappPaystackLink(order)
  if (!result.ok) {
    return result
  }
  if (result.reused && !options?.forceResend) {
    return { ...result, messageSent: false as const }
  }
  const message = formatPaymentLinkMessage(order, result.authorizationUrl)
  const readiness = getWhatsappAgentReadiness(currentConfig)
  if (
    currentConfig.whatsappEnabled &&
    readiness.whatsappCredentialsReady
  ) {
    await sendTextMessage(order.whatsapp_id, message, currentConfig.meta)
    await store.saveMessage({
      whatsappId: order.whatsapp_id,
      role: 'assistant',
      content: message,
    })
  }
  return { ...result, message, messageSent: true as const }
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

  const customer = await store.ensureCustomer(
    message.from,
    message.displayName || null,
  )
  await store.saveMessage({
    whatsappId: message.from,
    role: 'user',
    content: message.text,
    externalMessageId: message.id || null,
  })

  if (customer.ai_paused) {
    console.info('[whatsapp-agent] ai_paused_skip', {
      customer: customerRef(message.from),
      reason: customer.ai_paused_reason,
    })
    return {
      text: null,
      events: [],
      aiPaused: true as const,
    }
  }

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
    showProducts: liveWhatsapp
      ? async (productIds) => {
          const resolved: Array<{
            product_id: string
            name: string
            price_ghs: number | null
          }> = []
          const skipped: Array<{ product_id: string; reason: string }> = []
          for (const rawId of productIds.slice(0, 10)) {
            const product = catalog.resolve(rawId) || catalog.get(rawId)
            if (!product) {
              skipped.push({ product_id: rawId, reason: 'not_found' })
              continue
            }
            resolved.push({
              product_id: product.id,
              name: product.name,
              price_ghs: product.price_ghs,
            })
          }

          if (
            resolved.length > 0 &&
            isMetaCatalogConfigured(currentConfig.meta)
          ) {
            try {
              if (resolved.length === 1) {
                await sendSingleProductMessage(
                  message.from,
                  {
                    catalogId: currentConfig.meta.catalogId,
                    productRetailerId: resolved[0]!.product_id,
                    bodyText: `Here’s ${resolved[0]!.name}:`,
                    footerText: 'Gelos Global',
                  },
                  currentConfig.meta,
                )
              } else {
                await sendMultiProductMessage(
                  message.from,
                  {
                    catalogId: currentConfig.meta.catalogId,
                    headerText: 'Gelos picks',
                    bodyText: 'Tap a product to view details and add it.',
                    footerText: 'Gelos Global',
                    sections: [
                      {
                        title: 'Products',
                        productRetailerIds: resolved.map((p) => p.product_id),
                      },
                    ],
                  },
                  currentConfig.meta,
                )
              }
              return {
                mode: 'meta_catalog',
                sent_count: resolved.length,
                sent: resolved,
                skipped,
                note:
                  'Native WhatsApp catalog product message sent. Wait for the customer to tap a product or send an order from the catalog.',
              }
            } catch (error) {
              console.warn(
                '[whatsapp-agent] meta_catalog_product_send_failed',
                error,
              )
              // Fall through to image cards.
            }
          }

          const sent: Array<{
            product_id: string
            name: string
            price_ghs: number | null
          }> = []
          for (const item of resolved.slice(0, 3)) {
            const product = catalog.get(item.product_id)
            if (!product?.image) {
              skipped.push({
                product_id: item.product_id,
                reason: 'no_public_image',
              })
              continue
            }
            const price =
              product.price_ghs === null
                ? 'Price on request'
                : `GHS ${product.price_ghs}`
            const variantNote = product.variants?.length
              ? `\nFlavours/options available — ask to pick one.`
              : ''
            const caption = [
              product.name,
              price,
              product.category ? `Category: ${product.category}` : null,
              `ID: ${product.id}`,
              variantNote.trim() || null,
            ]
              .filter(Boolean)
              .join('\n')
            try {
              await sendImageMessage(
                message.from,
                { imageUrl: product.image, caption },
                currentConfig.meta,
              )
              sent.push(item)
            } catch (error) {
              skipped.push({
                product_id: product.id,
                reason:
                  error instanceof Error ? error.message : 'send_image_failed',
              })
            }
          }
          return {
            mode: 'image_fallback',
            sent_count: sent.length,
            sent,
            skipped,
            note:
              sent.length > 0
                ? 'Product photos sent. Ask which product they want, then offer_variant_picker if needed.'
                : 'No product photos could be sent. Describe products in text instead.',
          }
        }
      : undefined,
    offerCatalogBrowse:
      liveWhatsapp && isMetaCatalogConfigured(currentConfig.meta)
        ? async (bodyText) => {
            try {
              const thumb = catalog.listActive().find((p) => p.image)?.id
              await sendCatalogBrowseMessage(
                message.from,
                {
                  bodyText: bodyText || undefined,
                  thumbnailProductRetailerId: thumb,
                },
                currentConfig.meta,
              )
              return {
                sent: true,
                note: 'Catalog browse message sent. Customer can open the full Meta catalog in WhatsApp.',
              }
            } catch (error) {
              return {
                sent: false,
                error:
                  error instanceof Error
                    ? error.message
                    : 'Failed to send catalog browse message',
              }
            }
          }
        : undefined,
    sendPaymentLink: liveWhatsapp
      ? async (orderId) => {
          const order = orderId
            ? await store.getOrder(orderId)
            : await store.getLatestOrderForCustomer(message.from)
          if (!order) {
            return {
              sent: false,
              error:
                'No WhatsApp order found yet. Create the order with CONFIRM ORDER first.',
            }
          }
          if (order.whatsapp_id !== message.from) {
            return { sent: false, error: 'Order does not belong to this customer.' }
          }
          try {
            const delivered = await deliverPaymentLink(order, currentConfig, {
              forceResend: true,
            })
            if (!delivered.ok) {
              return {
                sent: false,
                skipped: 'skipped' in delivered ? delivered.skipped : false,
                error: delivered.reason,
              }
            }
            return {
              sent: true,
              provider: delivered.provider,
              payment_url: delivered.authorizationUrl,
              reference: delivered.reference,
              reused: delivered.reused,
              note: 'Paystack link sent to the customer on WhatsApp. Remind them not to share PIN/OTP here.',
            }
          } catch (error) {
            return {
              sent: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to create payment link',
            }
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
      let order = event.order as WaOrderRecord
      await syncOrder(order, currentConfig)

      if (paymentMethodNeedsPaystackLink(order.payment_method)) {
        try {
          const delivered = await deliverPaymentLink(order, currentConfig)
          if (delivered.ok) {
            order = {
              ...order,
              payment_link: delivered.authorizationUrl,
              payment_reference: delivered.reference,
              payment_status: 'Awaiting payment',
            }
          } else if (!delivered.skipped) {
            await notifyStaff(
              `Order ${order.order_id}: Paystack link failed — ${delivered.reason}. Send a payment link manually.`,
              currentConfig,
            )
          }
        } catch (error) {
          console.error('[whatsapp-agent] payment_link_failed', error)
          await notifyStaff(
            `Order ${order.order_id}: Paystack link failed. Send a payment link manually.`,
            currentConfig,
          )
        }
      }

      await notifyStaff(formatStaffOrderNotification(order), currentConfig)
    }
    if (event.event === 'handoff_created' && event.handoff) {
      const handoff = event.handoff as {
        urgency: string
        reason: string
      }
      await store.setCustomerAiPaused(
        message.from,
        true,
        `Handoff: ${handoff.reason}`,
      )
      await notifyStaff(
        `Gelos handoff (${handoff.urgency}) for customer ${customerRef(message.from)}: ${handoff.reason}\nAI paused — reply from Admin → WhatsApp.`,
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
