'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ChevronDown,
  ChevronLeft,
  Clock3,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Printer,
  ShoppingBag,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  FulfillmentStatusBadge,
  PaymentStatusBadge,
} from '@/components/admin/order-status-badge'
import { OrderTimeline } from '@/components/admin/order-timeline'
import { ConversionDetailsDialog } from '@/components/admin/conversion-details-dialog'
import { formatOrderTotal } from '@/lib/admin/order-format'
import { printOrderReceipt } from '@/lib/admin/print-order-receipt'
import type { AdminOrderDetail, FulfillmentStatus, PaymentStatus } from '@/lib/types/order'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

type OrderDetailViewProps = {
  order: AdminOrderDetail
  updating?: boolean
  sendingInvoice?: boolean
  repairingItems?: boolean
  onPaymentStatusChange?: (status: PaymentStatus) => void
  onSendInvoice?: () => void
  onFulfillmentStatusChange?: (status: FulfillmentStatus) => void
  onRepairItems?: () => void
}

const PAYMENT_STATUSES: PaymentStatus[] = [
  'Payment pending',
  'Paid',
  'Partially paid',
  'Refunded',
  'Voided',
]

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  'Payment pending': 'Mark as payment pending',
  Paid: 'Mark as paid',
  'Partially paid': 'Mark as partially paid',
  Refunded: 'Mark as refunded',
  Voided: 'Mark as voided',
}

function getPrimaryPaymentAction(status: PaymentStatus): PaymentStatus | null {
  switch (status) {
    case 'Payment pending':
    case 'Partially paid':
      return 'Paid'
    case 'Paid':
    case 'Refunded':
    case 'Voided':
      return null
    default:
      return 'Paid'
  }
}

function getPaymentAmounts(order: AdminOrderDetail) {
  switch (order.paymentStatus) {
    case 'Paid':
      return { paid: order.total, balance: 0 }
    case 'Refunded':
    case 'Voided':
      return { paid: 0, balance: 0 }
    default:
      return { paid: 0, balance: order.total }
  }
}

function PaymentActions({
  status,
  updating,
  onStatusChange,
}: {
  status: PaymentStatus
  updating: boolean
  onStatusChange: (status: PaymentStatus) => void
}) {
  const primaryAction = getPrimaryPaymentAction(status)
  const dropdownOptions = PAYMENT_STATUSES.filter((option) => option !== status)

  if (dropdownOptions.length === 0) return null

  const loading = updating ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : null

  if (!primaryAction) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="gap-1.5 bg-neutral-950 hover:bg-neutral-800"
            disabled={updating}
          >
            {loading ?? (
              <>
                Change payment status
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {dropdownOptions.map((option) => (
            <DropdownMenuItem
              key={option}
              onClick={() => onStatusChange(option)}
            >
              {PAYMENT_LABELS[option]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <ButtonGroup>
      <Button
        className="bg-neutral-950 hover:bg-neutral-800"
        disabled={updating}
        onClick={() => onStatusChange(primaryAction)}
      >
        {loading ?? PAYMENT_LABELS[primaryAction]}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="bg-neutral-950 px-2 hover:bg-neutral-800"
            disabled={updating}
            aria-label="More payment actions"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {dropdownOptions.map((option) => (
            <DropdownMenuItem
              key={option}
              onClick={() => onStatusChange(option)}
            >
              {PAYMENT_LABELS[option]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}

const FULFILLMENT_STATUSES: FulfillmentStatus[] = [
  'Unfulfilled',
  'Processing',
  'Fulfilled',
  'Shipped',
  'Delivered',
]

const FULFILLMENT_LABELS: Record<FulfillmentStatus, string> = {
  Unfulfilled: 'Mark as unfulfilled',
  Processing: 'Mark as processing',
  Fulfilled: 'Mark as fulfilled',
  Shipped: 'Mark as shipped',
  Delivered: 'Mark as delivered',
}

function getPrimaryFulfillmentAction(
  status: FulfillmentStatus,
): FulfillmentStatus | null {
  switch (status) {
    case 'Unfulfilled':
    case 'Processing':
      return 'Fulfilled'
    case 'Fulfilled':
      return 'Shipped'
    case 'Shipped':
      return 'Delivered'
    default:
      return null
  }
}

function FulfillmentActions({
  status,
  updating,
  onStatusChange,
}: {
  status: FulfillmentStatus
  updating: boolean
  onStatusChange: (status: FulfillmentStatus) => void
}) {
  const primaryAction = getPrimaryFulfillmentAction(status)
  const dropdownOptions = FULFILLMENT_STATUSES.filter((option) => option !== status)

  if (dropdownOptions.length === 0) return null

  const loading = updating ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : null

  if (!primaryAction) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="gap-1.5 bg-neutral-950 hover:bg-neutral-800"
            disabled={updating}
          >
            {loading ?? (
              <>
                Change fulfillment status
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {dropdownOptions.map((option) => (
            <DropdownMenuItem
              key={option}
              onClick={() => onStatusChange(option)}
            >
              {FULFILLMENT_LABELS[option]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <ButtonGroup>
      <Button
        className="bg-neutral-950 hover:bg-neutral-800"
        disabled={updating}
        onClick={() => onStatusChange(primaryAction)}
      >
        {loading ?? FULFILLMENT_LABELS[primaryAction]}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="bg-neutral-950 px-2 hover:bg-neutral-800"
            disabled={updating}
            aria-label="More fulfillment actions"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {dropdownOptions.map((option) => (
            <DropdownMenuItem
              key={option}
              onClick={() => onStatusChange(option)}
            >
              {FULFILLMENT_LABELS[option]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}

function Panel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm',
        className,
      )}
    >
      {children}
    </section>
  )
}

function PanelHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 bg-neutral-50/80 px-4 py-3',
        className,
      )}
    >
      {children}
    </div>
  )
}

function SummaryRow({
  label,
  value,
  bold,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 text-sm',
        bold ? 'font-semibold text-neutral-950' : 'text-neutral-600',
      )}
    >
      <span>{label}</span>
      <span className={bold ? 'text-neutral-950' : ''}>{value}</span>
    </div>
  )
}

export function OrderDetailView({
  order,
  updating = false,
  sendingInvoice = false,
  repairingItems = false,
  onPaymentStatusChange,
  onSendInvoice,
  onFulfillmentStatusChange,
  onRepairItems,
}: OrderDetailViewProps) {
  const [conversionOpen, setConversionOpen] = useState(false)
  const [invoiceConfirmOpen, setInvoiceConfirmOpen] = useState(false)
  const { paid, balance } = getPaymentAmounts(order)
  const itemLabel = order.items === 1 ? '1 item' : `${order.items} items`
  const showSendInvoice =
    Boolean(onSendInvoice) &&
    balance > 0 &&
    order.paymentStatus !== 'Refunded' &&
    order.paymentStatus !== 'Voided'
  const canRepairItems =
    Boolean(onRepairItems) &&
    order.items === 0 &&
    Boolean(order.paystackReference) &&
    !order.paystackReference.startsWith('cod_')

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-neutral-950"
          >
            <ChevronLeft className="h-4 w-4" />
            Orders
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-neutral-950">
              {order.orderNumber}
            </h1>
            <PaymentStatusBadge status={order.paymentStatus} />
            <FulfillmentStatusBadge status={order.fulfillmentStatus} />
          </div>
          <p className="text-sm text-neutral-600">
            {order.dateLabel} from {order.channel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canRepairItems ? (
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={repairingItems}
              onClick={() => onRepairItems?.()}
            >
              {repairingItems ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShoppingBag className="h-4 w-4" />
              )}
              Restore items from Paystack
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => {
              void printOrderReceipt(order).then((opened) => {
                if (!opened) {
                  toast.error('Could not open PDF. Check your popup blocker.')
                }
              })
            }}
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Panel>
            <PanelHeader>
              <FulfillmentStatusBadge status={order.fulfillmentStatus} />
              <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                {order.deliveryMethod}
              </span>
            </PanelHeader>
            <div className="space-y-4 px-4 py-4">
              <p className="text-sm text-neutral-600">
                Shipping · {order.deliveryMethod}
              </p>

              <ul className="space-y-3">
                {order.lineItems.length === 0 ? (
                  <li className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                    No line items stored on this order.
                    {canRepairItems
                      ? ' Try restoring them from Paystack metadata.'
                      : ''}
                  </li>
                ) : null}
                {order.lineItems.map((item) => {
                  const lineTotal =
                    item.lineTotal ?? item.price * item.quantity
                  const imageSrc = item.image ?? item.variantImage

                  return (
                    <li
                      key={`${item.id}-${item.variantImage ?? ''}-${item.name}`}
                      className="flex gap-3"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100 ring-1 ring-black/5">
                        {imageSrc ? (
                          <Image
                            src={imageSrc}
                            alt={item.productName ?? item.name}
                            fill
                            className="object-contain p-1"
                            sizes="56px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-neutral-400">
                            —
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-neutral-950">
                              {item.productName ?? item.name}
                            </p>
                            {item.variantLabel &&
                            item.variantLabel !== item.productName ? (
                              <p className="text-sm text-neutral-500">
                                {item.variantLabel}
                              </p>
                            ) : null}
                            {item.productHref ? (
                              <Link
                                href={item.productHref}
                                target="_blank"
                                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:text-sky-900"
                              >
                                View product
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            ) : null}
                          </div>
                          <div className="text-right text-sm">
                            <p className="text-neutral-500">
                              {formatOrderTotal(order.currency, item.price)} ×{' '}
                              {item.quantity}
                            </p>
                            <p className="font-semibold text-neutral-950">
                              {formatOrderTotal(order.currency, lineTotal)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
            {onFulfillmentStatusChange ? (
              <div className="border-t border-neutral-200 px-4 py-3">
                <FulfillmentActions
                  status={order.fulfillmentStatus}
                  updating={updating}
                  onStatusChange={onFulfillmentStatusChange}
                />
              </div>
            ) : null}
          </Panel>

          <Panel>
            <PanelHeader>
              <PaymentStatusBadge status={order.paymentStatus} />
            </PanelHeader>
            <div className="space-y-3 px-4 py-4">
              <SummaryRow
                label={`Subtotal · ${itemLabel}`}
                value={formatOrderTotal(order.currency, order.subtotal)}
              />
              {order.discount > 0 ? (
                <SummaryRow
                  label="Discount"
                  value={`-${formatOrderTotal(order.currency, order.discount)}`}
                />
              ) : null}
              <SummaryRow
                label={`Shipping (${order.deliveryMethod})`}
                value={formatOrderTotal(order.currency, order.shipping)}
              />
              <Separator />
              <SummaryRow
                label="Total"
                value={formatOrderTotal(order.currency, order.total)}
                bold
              />
              <SummaryRow
                label="Paid"
                value={formatOrderTotal(order.currency, paid)}
              />
              <SummaryRow
                label="Balance"
                value={formatOrderTotal(order.currency, balance)}
                bold
              />
            </div>
            {showSendInvoice || onPaymentStatusChange ? (
              <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 px-4 py-3">
                {showSendInvoice ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={sendingInvoice || updating}
                    onClick={() => setInvoiceConfirmOpen(true)}
                  >
                    {sendingInvoice ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Send invoice'
                    )}
                  </Button>
                ) : null}
                {onPaymentStatusChange ? (
                  <PaymentActions
                    status={order.paymentStatus}
                    updating={updating}
                    onStatusChange={onPaymentStatusChange}
                  />
                ) : null}
              </div>
            ) : null}
          </Panel>

          <Panel>
            <PanelHeader>
              <h2 className="text-sm font-semibold text-neutral-950">Timeline</h2>
            </PanelHeader>
            <div className="px-4 py-4">
              <OrderTimeline events={order.timeline} />
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel>
            <PanelHeader>
              <h2 className="text-sm font-semibold text-neutral-950">Notes</h2>
            </PanelHeader>
            <div className="px-4 py-4 text-sm text-neutral-500">
              No notes from customer
            </div>
          </Panel>

          <Panel>
            <PanelHeader>
              <h2 className="text-sm font-semibold text-neutral-950">Customer</h2>
            </PanelHeader>
            <div className="space-y-4 px-4 py-4 text-sm">
              <div>
                <p className="font-medium text-neutral-950">{order.customer}</p>
                <p className="text-neutral-500">
                  {order.conversionSummary.totalOrders}{' '}
                  {order.conversionSummary.totalOrders === 1 ? 'order' : 'orders'}
                </p>
              </div>

              <div className="space-y-2">
                <a
                  href={`mailto:${order.customerEmail}`}
                  className="flex items-center gap-2 text-sky-700 hover:text-sky-900"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="break-all">{order.customerEmail}</span>
                </a>
                {order.customerPhone ? (
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="flex items-center gap-2 text-neutral-700 hover:text-neutral-950"
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    {order.customerPhone}
                  </a>
                ) : (
                  <p className="text-neutral-500">No phone number</p>
                )}
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Shipping address
                </p>
                {order.shippingAddress ? (
                  <div className="flex gap-2 text-neutral-700">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="whitespace-pre-wrap">{order.shippingAddress}</p>
                  </div>
                ) : (
                  <p className="text-neutral-500">No shipping address</p>
                )}
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Billing address
                </p>
                <p className="text-neutral-600">
                  {order.shippingAddress
                    ? 'Same as shipping address'
                    : 'No billing address'}
                </p>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader>
              <h2 className="text-sm font-semibold text-neutral-950">
                Conversion summary
              </h2>
            </PanelHeader>
            <div className="space-y-3 px-4 py-4 text-sm text-neutral-700">
              <div className="flex gap-2.5">
                <ShoppingBag className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                <p>
                  {order.conversionSummary.isFirstOrder
                    ? 'This is their 1st order.'
                    : `This is their ${order.conversionSummary.orderIndexLabel} order.`}
                </p>
              </div>
              <div className="flex gap-2.5">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                <p>
                  {order.conversionSummary.isFirstOrder
                    ? `1st order from ${order.conversionSummary.firstVisitSource}.`
                    : `Ordered via ${order.conversionSummary.referralSource}.`}
                </p>
              </div>
              <div className="flex gap-2.5">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                <p>
                  {order.conversionSummary.orderCountLabel} over{' '}
                  {order.conversionSummary.daysActiveLabel}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConversionOpen(true)}
                className="inline-block pt-1 text-sm font-medium text-sky-700 hover:text-sky-900"
              >
                View conversion details
              </button>
            </div>
          </Panel>

          <ConversionDetailsDialog
            open={conversionOpen}
            onOpenChange={setConversionOpen}
            details={order.conversionSummary.details}
          />

          <Panel>
            <PanelHeader>
              <h2 className="text-sm font-semibold text-neutral-950">
                Order details
              </h2>
            </PanelHeader>
            <dl className="space-y-3 px-4 py-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Reference</dt>
                <dd className="break-all text-right font-mono text-xs text-neutral-950">
                  {order.paystackReference}
                </dd>
              </div>
              {order.affiliateCode ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">Affiliate</dt>
                  <dd className="text-right text-neutral-950">
                    {order.affiliateCode}
                  </dd>
                </div>
              ) : null}
            </dl>
          </Panel>
        </div>
      </div>

      <AlertDialog open={invoiceConfirmOpen} onOpenChange={setInvoiceConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send invoice?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-neutral-600">
                <p>
                  An invoice for{' '}
                  <span className="font-semibold text-neutral-950">
                    {formatOrderTotal(order.currency, balance)}
                  </span>{' '}
                  will be emailed to{' '}
                  <span className="font-medium text-neutral-950">
                    {order.customerEmail}
                  </span>
                  .
                </p>
                <p>
                  The customer will receive order {order.orderNumber} with payment
                  details and a link to complete checkout if payment is still due.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sendingInvoice}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={sendingInvoice}
              onClick={() => {
                setInvoiceConfirmOpen(false)
                onSendInvoice?.()
              }}
            >
              {sendingInvoice ? 'Sending…' : 'Send invoice'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
