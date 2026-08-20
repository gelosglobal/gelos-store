import type { WhatsappOrderService } from '@/lib/whatsapp-agent/order-service'

export const toolDefinitions = [
  {
    type: 'function' as const,
    name: 'search_products',
    description:
      'Search the approved Gelos catalogue. Use this before discussing availability, variants or price.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Customer product request or keywords.',
        },
        category: {
          type: ['string', 'null'],
          description: 'Optional category filter.',
        },
      },
      required: ['query', 'category'],
      additionalProperties: false,
    },
  },
  {
    type: 'function' as const,
    name: 'set_customer_details',
    description:
      "Save the customer's confirmed name and optional alternate phone number or note.",
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        alternate_phone: { type: ['string', 'null'] },
        notes: { type: ['string', 'null'] },
      },
      required: ['name', 'alternate_phone', 'notes'],
      additionalProperties: false,
    },
  },
  {
    type: 'function' as const,
    name: 'set_cart_items',
    description:
      "Replace the current cart with the customer's confirmed products, variants and quantities.",
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            properties: {
              product_id: { type: 'string' },
              variant: { type: ['string', 'null'] },
              quantity: { type: 'integer', minimum: 1, maximum: 100 },
            },
            required: ['product_id', 'variant', 'quantity'],
            additionalProperties: false,
          },
        },
      },
      required: ['items'],
      additionalProperties: false,
    },
  },
  {
    type: 'function' as const,
    name: 'set_delivery_details',
    description:
      'Save the delivery area and either a landmark or coordinates from a WhatsApp location pin.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        area: { type: 'string' },
        landmark: { type: ['string', 'null'] },
        latitude: { type: ['number', 'null'] },
        longitude: { type: ['number', 'null'] },
        location_url: { type: ['string', 'null'] },
      },
      required: ['area', 'landmark', 'latitude', 'longitude', 'location_url'],
      additionalProperties: false,
    },
  },
  {
    type: 'function' as const,
    name: 'set_payment_method',
    description: 'Save the payment method selected by the customer.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        method: {
          type: 'string',
          enum: [
            'cash_on_delivery',
            'mobile_money',
            'card',
            'bank_transfer',
            'other',
          ],
        },
        notes: { type: ['string', 'null'] },
      },
      required: ['method', 'notes'],
      additionalProperties: false,
    },
  },
  {
    type: 'function' as const,
    name: 'get_order_summary',
    description:
      'Return the current draft, missing details, totals and confirmation instruction.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
  {
    type: 'function' as const,
    name: 'create_order',
    description:
      "Create the order only when the customer's actual latest message is exactly CONFIRM ORDER.",
    strict: true,
    parameters: {
      type: 'object',
      properties: { confirmation_phrase: { type: 'string' } },
      required: ['confirmation_phrase'],
      additionalProperties: false,
    },
  },
  {
    type: 'function' as const,
    name: 'request_human_handoff',
    description:
      'Escalate complaints, refunds, payment issues, medical questions, uncertainty or a customer request for a person.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        reason: { type: 'string' },
        summary: { type: ['string', 'null'] },
        urgency: { type: 'string', enum: ['normal', 'high'] },
      },
      required: ['reason', 'summary', 'urgency'],
      additionalProperties: false,
    },
  },
  {
    type: 'function' as const,
    name: 'offer_variant_picker',
    description:
      'Send a WhatsApp list picker for a product that has variants (e.g. toothpaste flavours). Use after search_products when the customer needs to choose a variant.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        product_id: { type: 'string' },
        body_text: {
          type: ['string', 'null'],
          description: 'Optional short message above the list.',
        },
      },
      required: ['product_id', 'body_text'],
      additionalProperties: false,
    },
  },
  {
    type: 'function' as const,
    name: 'offer_payment_buttons',
    description:
      'Send WhatsApp buttons for Cash on delivery, Mobile Money, and Card. Use when asking for payment method.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
  {
    type: 'function' as const,
    name: 'send_payment_link',
    description:
      'Create or resend a secure Paystack payment link for Mobile Money or Card. Prefer after create_order; can also target the latest order. Do not use for cash on delivery.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        order_id: {
          type: ['string', 'null'],
          description:
            'WhatsApp order id (e.g. GELOS-...). Null uses the customer latest order.',
        },
      },
      required: ['order_id'],
      additionalProperties: false,
    },
  },
  {
    type: 'function' as const,
    name: 'show_products',
    description:
      'Send WhatsApp product cards (image + price + short caption) so the customer can browse. Use when they ask to see products, options, photos, or the catalogue. Pass product_ids from search_products (max 3).',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        product_ids: {
          type: 'array',
          minItems: 1,
          maxItems: 3,
          items: { type: 'string' },
        },
      },
      required: ['product_ids'],
      additionalProperties: false,
    },
  },
  {
    type: 'function' as const,
    name: 'offer_catalog_browse',
    description:
      'Send a WhatsApp “View catalog” message for the full Meta Commerce Catalog. Only works when WHATSAPP_META_CATALOG_MESSAGES is enabled. Prefer show_products for normal browsing.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        body_text: {
          type: ['string', 'null'],
          description: 'Optional short message above the View catalog button.',
        },
      },
      required: ['body_text'],
      additionalProperties: false,
    },
  },
]

export function createToolRunner({
  orderService,
  whatsappId,
  rawCustomerMessage,
  offerVariantPicker,
  offerPaymentButtons,
  showProducts,
  sendPaymentLink,
  offerCatalogBrowse,
}: {
  orderService: WhatsappOrderService
  whatsappId: string
  rawCustomerMessage: string
  offerVariantPicker?: (
    productId: string,
    bodyText?: string | null,
  ) => Promise<unknown>
  offerPaymentButtons?: () => Promise<unknown>
  showProducts?: (productIds: string[]) => Promise<unknown>
  sendPaymentLink?: (orderId?: string | null) => Promise<unknown>
  offerCatalogBrowse?: (bodyText?: string | null) => Promise<unknown>
}) {
  return async function runTool(name: string, args: Record<string, unknown>) {
    switch (name) {
      case 'search_products':
        return {
          ok: true,
          products: orderService.searchProducts(
            String(args.query ?? ''),
            (args.category as string | null) ?? null,
          ),
        }
      case 'set_customer_details':
        return {
          ok: true,
          customer: await orderService.setCustomerDetails(whatsappId, args as never),
        }
      case 'set_cart_items':
        return {
          ok: true,
          cart: await orderService.setCartItems(
            whatsappId,
            (args.items as never) || [],
          ),
        }
      case 'set_delivery_details':
        return {
          ok: true,
          cart: await orderService.setDeliveryDetails(whatsappId, args as never),
        }
      case 'set_payment_method':
        return {
          ok: true,
          cart: await orderService.setPaymentMethod(
            whatsappId,
            String(args.method),
            (args.notes as string | null) ?? null,
          ),
        }
      case 'get_order_summary':
        return { ok: true, draft: await orderService.getDraft(whatsappId) }
      case 'create_order': {
        const order = await orderService.createOrder(
          whatsappId,
          rawCustomerMessage,
        )
        return { ok: true, event: 'order_created', order }
      }
      case 'request_human_handoff': {
        const handoff = await orderService.requestHandoff(whatsappId, args as never)
        return { ok: true, event: 'handoff_created', handoff }
      }
      case 'offer_variant_picker': {
        if (!offerVariantPicker) {
          return {
            ok: false,
            error:
              'Variant picker is only available on live WhatsApp chats. List the variants in text instead.',
          }
        }
        const pickerResult = await offerVariantPicker(
          String(args.product_id),
          (args.body_text as string | null) ?? null,
        )
        return {
          ok: true,
          ...(pickerResult as Record<string, unknown>),
        }
      }
      case 'offer_payment_buttons': {
        if (!offerPaymentButtons) {
          return {
            ok: false,
            error:
              'Payment buttons are only available on live WhatsApp chats. Ask for the method in text instead.',
          }
        }
        const buttonsResult = await offerPaymentButtons()
        return { ok: true, ...(buttonsResult as Record<string, unknown>) }
      }
      case 'send_payment_link': {
        if (!sendPaymentLink) {
          return {
            ok: false,
            error:
              'Payment links are only available on live WhatsApp chats. Tell the customer staff will send a secure link.',
          }
        }
        const linkResult = await sendPaymentLink(
          (args.order_id as string | null) ?? null,
        )
        return { ok: true, ...(linkResult as Record<string, unknown>) }
      }
      case 'show_products': {
        if (!showProducts) {
          return {
            ok: false,
            error:
              'Product photos are only available on live WhatsApp chats. Describe products in text instead.',
          }
        }
        const ids = Array.isArray(args.product_ids)
          ? (args.product_ids as string[]).map(String).slice(0, 3)
          : []
        const showResult = await showProducts(ids)
        return { ok: true, ...(showResult as Record<string, unknown>) }
      }
      case 'offer_catalog_browse': {
        if (!offerCatalogBrowse) {
          return {
            ok: false,
            error:
              'Catalog browse is only available on live WhatsApp when Meta Catalog is connected. List a few products with show_products instead.',
          }
        }
        const browseResult = await offerCatalogBrowse(
          (args.body_text as string | null) ?? null,
        )
        return { ok: true, ...(browseResult as Record<string, unknown>) }
      }
      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  }
}

export function validateStrictToolSchemas(
  definitions: typeof toolDefinitions = toolDefinitions,
) {
  const errors: string[] = []
  const visit = (schema: Record<string, unknown>, path: string) => {
    if (schema?.type === 'object') {
      if (schema.additionalProperties !== false) {
        errors.push(`${path}: additionalProperties must be false`)
      }
      const properties = (schema.properties || {}) as Record<
        string,
        Record<string, unknown>
      >
      const propertyNames = Object.keys(properties)
      const required = new Set((schema.required as string[]) || [])
      for (const property of propertyNames) {
        if (!required.has(property)) {
          errors.push(`${path}.${property}: must be required (nullable if optional)`)
        }
        visit(properties[property], `${path}.${property}`)
      }
    }
    if (schema?.type === 'array' && schema.items) {
      visit(schema.items as Record<string, unknown>, `${path}[]`)
    }
  }
  for (const definition of definitions) {
    visit(definition.parameters as Record<string, unknown>, definition.name)
  }
  return errors
}
