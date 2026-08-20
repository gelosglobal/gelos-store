import crypto from 'crypto'
import type { WhatsappAgentConfig } from '@/lib/whatsapp-agent/config'

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export function verifyWebhookSignature(
  rawBody: Buffer | Uint8Array | string,
  signatureHeader: string | null | undefined,
  appSecret: string,
) {
  if (!appSecret || !signatureHeader?.startsWith('sha256=')) return false
  const expected = `sha256=${crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex')}`
  return safeEqual(expected, signatureHeader)
}

function interactiveText(message: {
  type?: string
  button?: { text?: string; payload?: string }
  interactive?: {
    button_reply?: { title?: string; id?: string }
    list_reply?: { title?: string; id?: string }
  }
  order?: {
    catalog_id?: string
    product_items?: Array<{
      product_retailer_id?: string
      quantity?: number
      item_price?: string
      currency?: string
    }>
  }
}) {
  if (message.type === 'order' && message.order?.product_items?.length) {
    const lines = message.order.product_items.map((item) => {
      const qty = item.quantity ?? 1
      const id = item.product_retailer_id || 'unknown'
      return `${qty}× product_id "${id}"`
    })
    return `Customer added catalog products to a WhatsApp order cart: ${lines.join('; ')}. Call set_cart_items with those product_ids and quantities (variant null unless the retailer id encodes one). Then continue collecting delivery and payment details.`
  }

  if (message.type === 'button') {
    return message.button?.text || message.button?.payload || ''
  }
  if (message.type !== 'interactive') return ''

  const listId = message.interactive?.list_reply?.id || ''
  const listTitle = message.interactive?.list_reply?.title || ''
  if (listId.startsWith('var|')) {
    const [, productId, ...variantParts] = listId.split('|')
    const variant = variantParts.join('|') || listTitle
    return `Customer selected variant "${variant}" for product_id "${productId}" from the options list. Call set_cart_items with that product_id, variant, and quantity 1 (or ask quantity if unclear).`
  }

  const buttonId = message.interactive?.button_reply?.id || ''
  const buttonTitle = message.interactive?.button_reply?.title || ''
  if (buttonId.startsWith('pay|')) {
    const method = buttonId.slice(4)
    return `Customer selected payment method "${method}" (${buttonTitle}). Call set_payment_method with method=${method}.`
  }

  return (
    listTitle ||
    listId ||
    buttonTitle ||
    buttonId ||
    ''
  )
}

export type IncomingWhatsappMessage = {
  id: string
  from: string
  displayName: string | null
  type?: string
  text: string
  location: {
    latitude: number
    longitude: number
    name: string | null
    address: string | null
    url: string
  } | null
  timestamp: string | null
}

export function extractIncomingMessages(
  payload: Record<string, unknown>,
): IncomingWhatsappMessage[] {
  const messages: IncomingWhatsappMessage[] = []
  for (const entry of (payload.entry as Array<Record<string, unknown>>) || []) {
    for (const change of (entry.changes as Array<Record<string, unknown>>) ||
      []) {
      const value = (change.value || {}) as Record<string, unknown>
      for (const message of (value.messages as Array<Record<string, unknown>>) ||
        []) {
        const contacts = (value.contacts as Array<Record<string, unknown>>) || []
        const contact = contacts.find(
          (candidate) => candidate.wa_id === message.from,
        )
        let text =
          (message.text as { body?: string } | undefined)?.body ||
          interactiveText(message as never)
        const referred = (
          message.context as
            | {
                referred_product?: {
                  catalog_id?: string
                  product_retailer_id?: string
                }
              }
            | undefined
        )?.referred_product
        if (referred?.product_retailer_id) {
          const inquiry =
            `Customer messaged about catalog product_id "${referred.product_retailer_id}". ` +
            'Call search_products / show_products or set_cart_items for that product_id, then continue helping them order.'
          text = text ? `${inquiry}\n\nCustomer message: ${text}` : inquiry
        }
        let location: IncomingWhatsappMessage['location'] = null
        const loc = message.location as
          | {
              latitude: number
              longitude: number
              name?: string
              address?: string
            }
          | undefined
        if (message.type === 'location' && loc) {
          location = {
            latitude: loc.latitude,
            longitude: loc.longitude,
            name: loc.name || null,
            address: loc.address || null,
            url: `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`,
          }
          text = `Customer shared a WhatsApp location pin: latitude ${location.latitude}, longitude ${location.longitude}`
          if (location.name) text += `, place name ${location.name}`
          if (location.address) text += `, address ${location.address}`
          text += '. Save these coordinates when collecting delivery details.'
        }
        if (message.type === 'order' && !text) {
          text = interactiveText(message as never)
        }
        if (!text) {
          text = `[Customer sent an unsupported ${message.type || 'unknown'} message. Request text or a location pin.]`
        }
        messages.push({
          id: String(message.id),
          from: String(message.from),
          displayName:
            ((contact?.profile as { name?: string } | undefined)?.name as
              | string
              | undefined) || null,
          type: message.type as string | undefined,
          text,
          location,
          timestamp: (message.timestamp as string | undefined) || null,
        })
      }
    }
  }
  return messages
}

async function graphRequest(
  settings: WhatsappAgentConfig['meta'],
  path: string,
  body: Record<string, unknown>,
) {
  if (!settings.graphApiVersion) {
    throw new Error('META_GRAPH_API_VERSION is required.')
  }
  const response = await fetch(
    `https://graph.facebook.com/${settings.graphApiVersion}/${path}`,
    {
      method: 'POST',
      signal: AbortSignal.timeout(30_000),
      headers: {
        authorization: `Bearer ${settings.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`WhatsApp API failed (${response.status}): ${text}`)
  }
  return text ? JSON.parse(text) : {}
}

export async function sendTextMessage(
  to: string,
  text: string,
  settings: WhatsappAgentConfig['meta'],
) {
  return graphRequest(settings, `${settings.phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: false, body: String(text).slice(0, 4096) },
  })
}

/** Product card: public HTTPS image + caption (name, price, id). */
export async function sendImageMessage(
  to: string,
  {
    imageUrl,
    caption,
  }: {
    imageUrl: string
    caption?: string
  },
  settings: WhatsappAgentConfig['meta'],
) {
  if (!/^https:\/\//i.test(imageUrl)) {
    throw new Error('WhatsApp image messages require a public https image URL.')
  }
  return graphRequest(settings, `${settings.phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'image',
    image: {
      link: imageUrl,
      ...(caption
        ? { caption: String(caption).slice(0, 1024) }
        : {}),
    },
  })
}

/** Meta interactive list — max 10 rows. Row id encodes product + variant. */
export function buildVariantListRows(
  productId: string,
  variants: string[],
  offset = 0,
) {
  const slice = variants.slice(offset, offset + 10)
  return slice.map((variant, index) => {
    const title = variant.slice(0, 24)
    return {
      id: `var|${productId}|${variant}`.slice(0, 200),
      title,
      description: index === 9 && offset + 10 < variants.length
        ? 'More flavours available — ask for more'
        : undefined,
    }
  })
}

export async function sendVariantPickerList(
  to: string,
  {
    productId,
    productName,
    variants,
    bodyText,
    offset = 0,
  }: {
    productId: string
    productName: string
    variants: string[]
    bodyText?: string
    offset?: number
  },
  settings: WhatsappAgentConfig['meta'],
) {
  const rows = buildVariantListRows(productId, variants, offset).map((row) => ({
    id: row.id,
    title: row.title,
    ...(row.description ? { description: row.description.slice(0, 72) } : {}),
  }))
  if (!rows.length) {
    throw new Error('No variants available for this product.')
  }
  return graphRequest(settings, `${settings.phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: {
        text: (
          bodyText ||
          `Pick a ${productName} option:`
        ).slice(0, 1024),
      },
      action: {
        button: 'See options',
        sections: [
          {
            title: productName.slice(0, 24),
            rows,
          },
        ],
      },
    },
  })
}

export async function sendPaymentMethodButtons(
  to: string,
  settings: WhatsappAgentConfig['meta'],
) {
  return graphRequest(settings, `${settings.phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: 'How would you like to pay?',
      },
      action: {
        buttons: [
          {
            type: 'reply',
            reply: { id: 'pay|cash_on_delivery', title: 'Cash on delivery' },
          },
          {
            type: 'reply',
            reply: { id: 'pay|mobile_money', title: 'Mobile Money' },
          },
          {
            type: 'reply',
            reply: { id: 'pay|card', title: 'Card' },
          },
        ],
      },
    },
  })
}

/** In-chat “View catalog” browse entry point (requires catalog linked to WABA). */
export async function sendCatalogBrowseMessage(
  to: string,
  {
    bodyText,
    thumbnailProductRetailerId,
  }: {
    bodyText?: string
    thumbnailProductRetailerId?: string
  },
  settings: WhatsappAgentConfig['meta'],
) {
  return graphRequest(settings, `${settings.phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'catalog_message',
      body: {
        text: (
          bodyText ||
          'Browse the Gelos catalogue and tap any product to learn more.'
        ).slice(0, 1024),
      },
      action: {
        name: 'catalog_message',
        ...(thumbnailProductRetailerId
          ? {
              parameters: {
                thumbnail_product_retailer_id: thumbnailProductRetailerId,
              },
            }
          : {}),
      },
    },
  })
}

/** Native WhatsApp single-product card from Meta Commerce Catalog. */
export async function sendSingleProductMessage(
  to: string,
  {
    catalogId,
    productRetailerId,
    bodyText,
    footerText,
  }: {
    catalogId: string
    productRetailerId: string
    bodyText?: string
    footerText?: string
  },
  settings: WhatsappAgentConfig['meta'],
) {
  return graphRequest(settings, `${settings.phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'product',
      body: {
        text: (bodyText || 'Here’s that product:').slice(0, 1024),
      },
      ...(footerText
        ? { footer: { text: footerText.slice(0, 60) } }
        : {}),
      action: {
        catalog_id: catalogId,
        product_retailer_id: productRetailerId,
      },
    },
  })
}

/**
 * Native WhatsApp multi-product message (up to 30 items, max 10 sections).
 * product_retailer_id values must exist in the connected Meta catalog.
 */
export async function sendMultiProductMessage(
  to: string,
  {
    catalogId,
    headerText,
    bodyText,
    footerText,
    sections,
  }: {
    catalogId: string
    headerText: string
    bodyText?: string
    footerText?: string
    sections: Array<{
      title: string
      productRetailerIds: string[]
    }>
  },
  settings: WhatsappAgentConfig['meta'],
) {
  const normalized = sections
    .map((section) => ({
      title: section.title.slice(0, 24),
      product_items: section.productRetailerIds
        .slice(0, 30)
        .map((id) => ({ product_retailer_id: id })),
    }))
    .filter((section) => section.product_items.length > 0)
    .slice(0, 10)

  if (!normalized.length) {
    throw new Error('Multi-product message needs at least one product.')
  }

  const total = normalized.reduce(
    (sum, section) => sum + section.product_items.length,
    0,
  )
  if (total > 30) {
    throw new Error('Multi-product messages support at most 30 products.')
  }

  return graphRequest(settings, `${settings.phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'product_list',
      header: {
        type: 'text',
        text: headerText.slice(0, 60),
      },
      body: {
        text: (bodyText || 'Pick a product to view details.').slice(0, 1024),
      },
      ...(footerText
        ? { footer: { text: footerText.slice(0, 60) } }
        : {}),
      action: {
        catalog_id: catalogId,
        sections: normalized,
      },
    },
  })
}

export async function markMessageRead(
  messageId: string,
  settings: WhatsappAgentConfig['meta'],
) {
  return graphRequest(settings, `${settings.phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
  })
}
