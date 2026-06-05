'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useLocation } from '@/components/location-provider'

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  const method = searchParams.get('method')
  const { formatPrice } = useLocation()
  const total = searchParams.get('total')
  const parsedTotal = total ? Number(total) : null

  const isCod = method === 'cod'

  return (
    <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white px-8 py-12 text-center shadow-sm">
      <CheckCircle2 className="mx-auto size-12 text-green-600" />
      <h1 className="mt-6 text-xl font-bold text-neutral-950">
        {isCod ? 'Order placed' : 'Payment successful'}
      </h1>
      {orderNumber ? (
        <p className="mt-2 text-sm text-neutral-600">
          Order <span className="font-semibold">{orderNumber}</span> is confirmed.
        </p>
      ) : null}
      {parsedTotal && !Number.isNaN(parsedTotal) ? (
        <p className="mt-1 text-sm text-neutral-500">
          Total: {formatPrice(parsedTotal)}
        </p>
      ) : null}
      {isCod ? (
        <p className="mt-4 text-sm text-neutral-600">
          Pay with cash when your order is delivered.
        </p>
      ) : null}
      <Link
        href="/shop"
        className="mt-8 inline-flex rounded-full bg-neutral-950 px-8 py-3 text-sm font-semibold text-white"
      >
        Continue shopping
      </Link>
    </div>
  )
}

function SuccessFallback() {
  return (
    <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white px-8 py-12 text-center shadow-sm">
      <Loader2 className="mx-auto size-10 animate-spin text-neutral-400" />
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-16">
      <Suspense fallback={<SuccessFallback />}>
        <CheckoutSuccessContent />
      </Suspense>
    </div>
  )
}
