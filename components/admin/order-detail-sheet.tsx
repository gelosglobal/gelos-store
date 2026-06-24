'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, Loader2, Mail, MapPin, Phone, Printer, User } from 'lucide-react'
import { toast } from 'sonner'
import {
  FulfillmentStatusBadge,
  PaymentStatusBadge,
} from '@/components/admin/order-status-badge'
import { OrderTimeline } from '@/components/admin/order-timeline'
import { formatOrderTotal } from '@/lib/admin/order-format'
import { printOrderReceipt } from '@/lib/admin/print-order-receipt'
import type { AdminOrderDetail } from '@/lib/types/order'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type OrderDetailSheetProps = {
  orderId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
      {children}
    </h3>
  )
}

function ContactItem({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof User
  label: string
  value?: string | null
  href?: string
}) {
  if (!value) return null

  const content = (
    <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50/80 px-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
          {label}
        </p>
        <p className="mt-0.5 break-words text-sm text-neutral-950">{value}</p>
      </div>
    </div>
  )

  if (href) {
    return (
      <a href={href} className="block transition-opacity hover:opacity-80">
        {content}
      </a>
    )
  }

  return content
}

export function OrderDetailSheet({
  orderId,
  open,
  onOpenChange,
}: OrderDetailSheetProps) {
  const [order, setOrder] = useState<AdminOrderDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !orderId) {
      setOrder(null)
      return
    }

    let cancelled = false

    async function loadOrder() {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`, {
          cache: 'no-store',
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        if (!cancelled) setOrder(data.order ?? null)
      } catch {
        if (!cancelled) {
          toast.error('Failed to load order details')
          onOpenChange(false)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadOrder()

    return () => {
      cancelled = true
    }
  }, [open, orderId, onOpenChange])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        {loading ? (
          <div className="flex h-full items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        ) : order ? (
          <>
            <SheetHeader className="border-b border-neutral-200 bg-neutral-50/80 px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
                <div>
                  <SheetTitle className="text-2xl">{order.orderNumber}</SheetTitle>
                  <SheetDescription className="mt-1 text-sm">
                    Placed {order.dateLabel}
                  </SheetDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0 bg-white"
                    aria-label="Open receipt PDF"
                    title="Open receipt PDF"
                    onClick={() => {
                      void printOrderReceipt(order).then((opened) => {
                        if (!opened) {
                          toast.error(
                            'Could not open PDF. Check your popup blocker.',
                          )
                        }
                      })
                    }}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                  <p className="text-xl font-semibold text-neutral-950">
                    {formatOrderTotal(order.currency, order.total)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-3">
                <PaymentStatusBadge status={order.paymentStatus} />
                <FulfillmentStatusBadge status={order.fulfillmentStatus} />
                <Badge variant="outline" className="bg-white">
                  {order.channel}
                </Badge>
              </div>
            </SheetHeader>

            <div className="space-y-8 px-6 py-6">
              <section className="space-y-4">
                <SectionTitle>Timeline</SectionTitle>
                <div className="rounded-xl border border-neutral-200 bg-white p-4">
                  <OrderTimeline events={order.timeline} />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <SectionTitle>Products ordered</SectionTitle>
                  <span className="text-sm text-neutral-500">
                    {order.items} {order.items === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border border-neutral-200">
                  <div className="hidden grid-cols-[minmax(0,1fr)_100px_80px_100px] gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 sm:grid">
                    <span>Product</span>
                    <span className="text-right">Unit price</span>
                    <span className="text-center">Qty</span>
                    <span className="text-right">Total</span>
                  </div>

                  <ul className="divide-y divide-neutral-200">
                    {order.lineItems.map((item) => {
                      const lineTotal =
                        item.lineTotal ?? item.price * item.quantity
                      const imageSrc = item.image ?? item.variantImage

                      return (
                        <li
                          key={`${item.id}-${item.variantImage ?? ''}-${item.name}`}
                          className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_100px_80px_100px] sm:items-center"
                        >
                          <div className="flex min-w-0 gap-3">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100 ring-1 ring-black/5">
                              {imageSrc ? (
                                <Image
                                  src={imageSrc}
                                  alt={item.productName ?? item.name}
                                  fill
                                  className="object-contain p-1.5"
                                  sizes="64px"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-[10px] font-medium text-neutral-400">
                                  No image
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                {item.category ? (
                                  <Badge
                                    variant="secondary"
                                    className="h-5 px-2 text-[10px]"
                                  >
                                    {item.category}
                                  </Badge>
                                ) : null}
                              </div>
                              <p className="mt-1 font-medium text-neutral-950">
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
                                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:text-sky-900"
                                >
                                  View product
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              ) : null}
                            </div>
                          </div>

                          <p className="text-sm text-neutral-600 sm:text-right">
                            <span className="mr-2 text-xs uppercase text-neutral-400 sm:hidden">
                              Unit
                            </span>
                            {formatOrderTotal(order.currency, item.price)}
                          </p>
                          <p className="text-sm font-medium text-neutral-950 sm:text-center">
                            <span className="mr-2 text-xs uppercase text-neutral-400 sm:hidden">
                              Qty
                            </span>
                            {item.quantity}
                          </p>
                          <p className="text-sm font-semibold text-neutral-950 sm:text-right">
                            <span className="mr-2 text-xs uppercase text-neutral-400 sm:hidden">
                              Total
                            </span>
                            {formatOrderTotal(order.currency, lineTotal)}
                          </p>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </section>

              <div className="grid gap-6 lg:grid-cols-2">
                <section className="space-y-4">
                  <SectionTitle>Customer</SectionTitle>
                  <div className="space-y-2">
                    <ContactItem icon={User} label="Name" value={order.customer} />
                    <ContactItem
                      icon={Mail}
                      label="Email"
                      value={order.customerEmail}
                      href={`mailto:${order.customerEmail}`}
                    />
                    <ContactItem
                      icon={Phone}
                      label="Phone"
                      value={order.customerPhone}
                      href={
                        order.customerPhone
                          ? `tel:${order.customerPhone}`
                          : undefined
                      }
                    />
                    <ContactItem
                      icon={MapPin}
                      label="Delivery address"
                      value={order.shippingAddress}
                    />
                  </div>
                </section>

                <section className="space-y-4">
                  <SectionTitle>Payment summary</SectionTitle>
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between text-neutral-600">
                        <span>Subtotal</span>
                        <span>
                          {formatOrderTotal(order.currency, order.subtotal)}
                        </span>
                      </div>
                      {order.discount > 0 ? (
                        <div className="flex justify-between text-neutral-600">
                          <span>Discount</span>
                          <span>
                            -{formatOrderTotal(order.currency, order.discount)}
                          </span>
                        </div>
                      ) : null}
                      <div className="flex justify-between text-neutral-600">
                        <span>Shipping</span>
                        <span>
                          {formatOrderTotal(order.currency, order.shipping)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-base font-semibold text-neutral-950">
                        <span>Total paid</span>
                        <span>
                          {formatOrderTotal(order.currency, order.total)}
                        </span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-neutral-500">Delivery method</dt>
                        <dd className="text-right text-neutral-950">
                          {order.deliveryMethod}
                        </dd>
                      </div>
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
                            {order.commissionAmount > 0
                              ? ` · ${formatOrderTotal(order.currency, order.commissionAmount)}`
                              : ''}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                </section>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
