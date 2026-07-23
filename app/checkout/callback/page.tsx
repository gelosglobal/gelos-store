'use client'

import Link from 'next/link'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { useCart } from '@/components/cart-provider'
import { useLocation } from '@/components/location-provider'
import { trackPurchase } from '@/lib/meta-pixel'
import { getOrCreateVisitorId } from '@/lib/visitor-id'

type VerifyState =
  | { status: 'loading' }
  | { status: 'success'; orderNumber: string; total: number; currency: string }
  | { status: 'error'; message: string }

function CheckoutCallbackContent() {
  const searchParams = useSearchParams()
  const reference = searchParams.get('reference') ?? searchParams.get('trxref')
  const { clearCart, isHydrated, items } = useCart()
  const { formatPrice } = useLocation()
  const [state, setState] = useState<VerifyState>({ status: 'loading' })
  const purchaseTracked = useRef(false)

  useEffect(() => {
    if (!reference) {
      setState({ status: 'error', message: 'Missing payment reference.' })
      return
    }

    let cancelled = false

    async function verifyPayment() {
      try {
        const response = await fetch('/api/paystack/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference,
            eventSourceUrl: window.location.href,
            visitorId: getOrCreateVisitorId() || undefined,
          }),
        })

        const data = (await response.json()) as {
          ok?: boolean
          error?: string
          order?: {
            orderNumber: string
            total: number
            currency: string
          }
        }

        if (!response.ok || !data.ok || !data.order) {
          throw new Error(data.error ?? 'Payment verification failed')
        }

        if (!cancelled) {
          if (!purchaseTracked.current) {
            purchaseTracked.current = true
            trackPurchase({
              value: data.order.total,
              currency: data.order.currency,
              orderId: data.order.orderNumber,
              items: items.map((item) => ({
                id: item.id,
                quantity: item.quantity,
              })),
            })
          }

          clearCart()
          setState({
            status: 'success',
            orderNumber: data.order.orderNumber,
            total: data.order.total,
            currency: data.order.currency,
          })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: 'error',
            message:
              error instanceof Error
                ? error.message
                : 'We could not confirm your payment.',
          })
        }
      }
    }

    if (isHydrated) {
      void verifyPayment()
    }

    return () => {
      cancelled = true
    }
  }, [reference, clearCart, isHydrated, items])

  return (
    <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white px-8 py-12 text-center shadow-sm">
      {state.status === 'loading' ? (
        <>
          <Loader2 className="mx-auto size-10 animate-spin text-neutral-400" />
          <h1 className="mt-6 text-xl font-bold text-neutral-950">
            Confirming your payment…
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Please wait while we verify your Paystack transaction.
          </p>
        </>
      ) : null}

      {state.status === 'success' ? (
        <>
          <CheckCircle2 className="mx-auto size-12 text-green-600" />
          <h1 className="mt-6 text-xl font-bold text-neutral-950">
            Payment successful
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Order <span className="font-semibold">{state.orderNumber}</span> is
            confirmed.
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Total paid: {formatPrice(state.total)}
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex rounded-full bg-neutral-950 px-8 py-3 text-sm font-semibold text-white"
          >
            Continue shopping
          </Link>
        </>
      ) : null}

      {state.status === 'error' ? (
        <>
          <XCircle className="mx-auto size-12 text-red-500" />
          <h1 className="mt-6 text-xl font-bold text-neutral-950">
            Payment not confirmed
          </h1>
          <p className="mt-2 text-sm text-neutral-600">{state.message}</p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/checkout"
              className="inline-flex rounded-full bg-neutral-950 px-8 py-3 text-sm font-semibold text-white"
            >
              Try again
            </Link>
            <Link
              href="/cart"
              className="text-sm font-medium text-neutral-600 underline-offset-2 hover:underline"
            >
              Back to cart
            </Link>
          </div>
        </>
      ) : null}
    </div>
  )
}

function CallbackFallback() {
  return (
    <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white px-8 py-12 text-center shadow-sm">
      <Loader2 className="mx-auto size-10 animate-spin text-neutral-400" />
      <h1 className="mt-6 text-xl font-bold text-neutral-950">
        Confirming your payment…
      </h1>
    </div>
  )
}

export default function CheckoutCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-16">
      <Suspense fallback={<CallbackFallback />}>
        <CheckoutCallbackContent />
      </Suspense>
    </div>
  )
}
