import { formatOrderDateLabel, formatOrderFullDate, formatOrderTotal } from '@/lib/admin/order-format'
import type { FulfillmentStatus, OrderTimelineEvent, PaymentStatus } from '@/lib/types/order'

type TimelineInput = {
  orderNumber: string
  channel: string
  paymentStatus: PaymentStatus
  fulfillmentStatus: FulfillmentStatus
  createdAt: Date
  updatedAt: Date
  affiliateCode?: string
  commissionAmount?: number
  currency?: string
  customerName?: string
  customerEmail?: string
  total?: number
}

const FULFILLMENT_STEPS: {
  status: FulfillmentStatus
  title: string
  description: string
}[] = [
  {
    status: 'Processing',
    title: 'Processing',
    description: 'Order is being prepared for fulfillment.',
  },
  {
    status: 'Fulfilled',
    title: 'Fulfilled',
    description: 'Items have been packed and are ready to go.',
  },
  {
    status: 'Shipped',
    title: 'Shipped',
    description: 'Order has left the warehouse and is on its way.',
  },
  {
    status: 'Delivered',
    title: 'Delivered',
    description: 'Order was delivered to the customer.',
  },
]

const FULFILLMENT_RANK: Record<FulfillmentStatus, number> = {
  Unfulfilled: -1,
  Processing: 0,
  Fulfilled: 1,
  Shipped: 2,
  Delivered: 3,
}

function paymentDescription(channel: string, paymentStatus: PaymentStatus): string {
  if (paymentStatus === 'Paid') {
    if (/paystack/i.test(channel)) return 'Online payment confirmed via Paystack.'
    if (/cash on delivery/i.test(channel)) return 'Marked as paid.'
    return 'Payment confirmed.'
  }

  if (paymentStatus === 'Partially paid') {
    return 'A partial payment has been recorded for this order.'
  }

  if (paymentStatus === 'Refunded') {
    return 'Payment was refunded to the customer.'
  }

  if (paymentStatus === 'Voided') {
    return 'Payment was voided for this order.'
  }

  if (/cash on delivery/i.test(channel)) {
    return 'Cash on delivery — collect payment when the order is fulfilled.'
  }

  return 'Waiting for customer payment to be confirmed.'
}

export function buildOrderTimeline(input: TimelineInput): OrderTimelineEvent[] {
  const events: OrderTimelineEvent[] = []
  const createdLabel = formatOrderDateLabel(input.createdAt)
  const createdFull = formatOrderFullDate(input.createdAt)
  const updatedLabel = formatOrderDateLabel(input.updatedAt)
  const currentRank = FULFILLMENT_RANK[input.fulfillmentStatus]

  events.push({
    id: 'placed',
    title: 'Order placed',
    description: `${input.orderNumber} was created on the storefront.`,
    timestamp: input.createdAt.toISOString(),
    timestampLabel: createdLabel,
    timestampFull: createdFull,
    status: 'completed',
  })

  if (input.customerName) {
    events.push({
      id: 'customer-placed',
      title: `${input.customerName} placed this order`,
      description: `${input.channel}${input.customerEmail ? ` · ${input.customerEmail}` : ''}`,
      timestamp: input.createdAt.toISOString(),
      timestampLabel: createdLabel,
      timestampFull: createdFull,
      status: 'completed',
    })
  }

  if (input.paymentStatus === 'Paid') {
    events.push({
      id: 'payment-received',
      title: 'Payment received',
      description: paymentDescription(input.channel, input.paymentStatus),
      timestamp: input.createdAt.toISOString(),
      timestampLabel: createdLabel,
      timestampFull: createdFull,
      status: 'completed',
    })
  } else if (
    input.paymentStatus === 'Refunded' ||
    input.paymentStatus === 'Voided'
  ) {
    events.push({
      id: 'payment-closed',
      title:
        input.paymentStatus === 'Refunded' ? 'Payment refunded' : 'Payment voided',
      description: paymentDescription(input.channel, input.paymentStatus),
      timestamp: input.updatedAt.toISOString(),
      timestampLabel: updatedLabel,
      timestampFull: formatOrderFullDate(input.updatedAt),
      status: 'completed',
    })
  } else {
    const amount =
      input.total != null && input.currency
        ? formatOrderTotal(input.currency, input.total)
        : 'Payment'
    events.push({
      id: 'payment-pending',
      title: 'Awaiting payment',
      description: `A ${amount} payment is pending on ${input.channel}.`,
      timestamp: input.createdAt.toISOString(),
      timestampLabel: createdLabel,
      status: input.fulfillmentStatus === 'Unfulfilled' ? 'current' : 'completed',
    })
  }

  if (input.affiliateCode) {
    events.push({
      id: 'affiliate',
      title: 'Affiliate referral recorded',
      description: `Referred by ${input.affiliateCode}${
        input.commissionAmount && input.commissionAmount > 0
          ? ` · commission pending`
          : ''
      }.`,
      timestamp: input.createdAt.toISOString(),
      timestampLabel: createdLabel,
      timestampFull: createdFull,
      status: 'completed',
    })
  }

  if (input.fulfillmentStatus === 'Unfulfilled' && input.paymentStatus === 'Paid') {
    events.push({
      id: 'ready-to-fulfill',
      title: 'Ready to fulfill',
      description: 'Payment is in — this order is waiting to be packed and shipped.',
      status: 'current',
    })
  } else {
    for (const step of FULFILLMENT_STEPS) {
      const stepRank = FULFILLMENT_RANK[step.status]
      if (stepRank > currentRank) continue

      const isCurrentStep =
        stepRank === currentRank && input.fulfillmentStatus !== 'Delivered'

      events.push({
        id: `fulfillment-${step.status.toLowerCase()}`,
        title: step.title,
        description: step.description,
        timestamp: input.updatedAt.toISOString(),
        timestampLabel: updatedLabel,
        status: isCurrentStep ? 'current' : 'completed',
      })

      if (isCurrentStep) break
    }
  }

  const wasUpdated =
    input.updatedAt.getTime() - input.createdAt.getTime() > 60_000

  if (wasUpdated) {
    events.push({
      id: 'updated',
      title: 'Order updated',
      description: 'Order details or status were last changed.',
      timestamp: input.updatedAt.toISOString(),
      timestampLabel: updatedLabel,
      timestampFull: formatOrderFullDate(input.updatedAt),
      status: 'completed',
    })
  }

  return events
}
