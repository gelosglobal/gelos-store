import Image from 'next/image'
import Link from 'next/link'
import { MessageCircle, Package } from 'lucide-react'
import { WhatsAppIcon } from '@/components/whatsapp-icon'
import { getProductImageDisplayClass } from '@/lib/product-image-display'
import { getAppUrl } from '@/lib/env'
import { getWhatsappOrderShareUrl } from '@/lib/db/whatsapp-orders'
import { getWhatsAppNumber } from '@/lib/whatsapp'
import type { WhatsappOrderSnapshot } from '@/lib/whatsapp-order-types'
import { buildWhatsAppOrderMessage, getWhatsAppOrderUrl } from '@/lib/whatsapp-order'

type WhatsappOrderShareViewProps = {
  orderId: string
  snapshot: WhatsappOrderSnapshot
}

export function WhatsappOrderShareView({
  orderId,
  snapshot,
}: WhatsappOrderShareViewProps) {
  const shareUrl = getWhatsappOrderShareUrl(orderId)
  const whatsappHref = getWhatsAppNumber()
    ? getWhatsAppOrderUrl(
        buildWhatsAppOrderMessage({
          lines: [],
          subtotalLabel: snapshot.subtotalLabel,
          totalLabel: snapshot.totalLabel,
          shareUrl,
        }),
      )
    : null

  const customer = snapshot.customer

  return (
    <div className="min-h-screen bg-[#e8f7ec] text-foreground">
      <div className="mx-auto max-w-lg px-4 py-6 sm:py-8">
        <header className="rounded-3xl bg-[#25D366] p-5 text-white shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                Gelos order
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                WhatsApp catalog
              </h1>
              <p className="mt-2 text-sm text-white/90">
                {snapshot.items.length} item{snapshot.items.length === 1 ? '' : 's'}
                {snapshot.locationLabel ? ` · ${snapshot.locationLabel}` : ''}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <Package className="h-6 w-6" />
            </div>
          </div>
        </header>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {snapshot.items.map((item) => (
            <article
              key={`${item.productId}-${item.name}`}
              className="overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm"
            >
              <Link
                href={item.productPath}
                className="relative block aspect-square overflow-hidden bg-neutral-50"
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className={getProductImageDisplayClass(item.productId, item.image)}
                  sizes="(max-width: 512px) 45vw, 220px"
                  unoptimized={item.image.startsWith('http')}
                />
                <span className="absolute right-2 top-2 rounded-full bg-neutral-950 px-2 py-0.5 text-[10px] font-bold text-white">
                  x{item.quantity}
                </span>
              </Link>
              <div className="space-y-1 p-3">
                <Link
                  href={item.productPath}
                  className="line-clamp-2 text-xs font-semibold leading-snug text-neutral-950 hover:underline"
                >
                  {item.name}
                </Link>
                <p className="text-[11px] text-neutral-500">
                  {item.unitPriceLabel} each
                </p>
                <p className="text-sm font-bold tabular-nums text-[#E91E8C]">
                  {item.lineTotalLabel}
                </p>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-5 rounded-2xl border border-white/80 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-950">Order summary</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-600">Subtotal</dt>
              <dd className="font-medium tabular-nums text-neutral-950">
                {snapshot.subtotalLabel}
              </dd>
            </div>
            {snapshot.discountLabel ? (
              <div className="flex justify-between gap-4 text-[#E91E8C]">
                <dt>
                  Promo{snapshot.promoCode ? ` (${snapshot.promoCode})` : ''}
                </dt>
                <dd className="font-medium tabular-nums">−{snapshot.discountLabel}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-600">Shipping</dt>
              <dd className="font-medium tabular-nums text-neutral-950">
                {snapshot.shippingLabel ?? 'Free'}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-neutral-100 pt-2">
              <dt className="font-semibold text-neutral-950">Total</dt>
              <dd className="text-base font-bold tabular-nums text-neutral-950">
                {snapshot.totalLabel}
              </dd>
            </div>
          </dl>
        </section>

        {customer?.name || customer?.phone || customer?.address || customer?.note ? (
          <section className="mt-4 rounded-2xl border border-white/80 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-neutral-950">Delivery details</h2>
            <dl className="mt-3 space-y-2 text-sm text-neutral-700">
              {customer.name ? (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Name
                  </dt>
                  <dd>{customer.name}</dd>
                </div>
              ) : null}
              {customer.phone ? (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Phone
                  </dt>
                  <dd>{customer.phone}</dd>
                </div>
              ) : null}
              {customer.address ? (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Address
                  </dt>
                  <dd className="whitespace-pre-wrap">{customer.address}</dd>
                </div>
              ) : null}
              {customer.note ? (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Note
                  </dt>
                  <dd>{customer.note}</dd>
                </div>
              ) : null}
            </dl>
          </section>
        ) : null}

        {whatsappHref ? (
          <a
            href={whatsappHref}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#1ebe57]"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Reply on WhatsApp
          </a>
        ) : (
          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm">
            <MessageCircle className="h-4 w-4 shrink-0" />
            Share this page with the Gelos team to confirm your order.
          </div>
        )}

        <p className="mt-4 text-center text-xs text-neutral-600">
          Order ref {orderId} · Shared from {getAppUrl().replace(/^https?:\/\//, '')}
        </p>
      </div>
    </div>
  )
}
