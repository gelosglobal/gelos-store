'use client'

import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import {
  loadStripe,
  type Stripe,
  type StripeCardNumberElement,
  type StripeElementChangeEvent,
  type StripeElementStyle,
} from '@stripe/stripe-js'
import { CircleHelp, Lock } from 'lucide-react'
import Image from 'next/image'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  type ReactNode,
  type Ref,
} from 'react'
import { paymentProviderLogos } from '@/lib/payment-provider-logos'
import { cn } from '@/lib/utils'

export type StripeCardConfirmBilling = {
  name: string
  email: string
  phone?: string
}

export type StripeCardFieldsHandle = {
  confirmPayment: (
    clientSecret: string,
    billing: StripeCardConfirmBilling,
  ) => Promise<{ paymentIntentId: string }>
}

type StripeCardFieldsProps = {
  disabled?: boolean
  defaultName?: string
  className?: string
}

const elementStyle: StripeElementStyle = {
  base: {
    fontSize: '15px',
    color: '#171717',
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSmoothing: 'antialiased',
    '::placeholder': { color: '#a3a3a3' },
  },
  invalid: { color: '#dc2626' },
}

const fieldShell =
  'relative flex min-h-[48px] items-center rounded-lg border border-neutral-300 bg-white px-3.5 transition-colors focus-within:border-neutral-950 focus-within:ring-1 focus-within:ring-neutral-950'

function StripeCardFieldsInner(
  { disabled, defaultName = '', className }: StripeCardFieldsProps,
  ref: Ref<StripeCardFieldsHandle>,
) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState('')
  const [cardholderName, setCardholderName] = useState(defaultName)
  const [useShippingAsBilling, setUseShippingAsBilling] = useState(true)

  useEffect(() => {
    if (defaultName && !cardholderName) {
      setCardholderName(defaultName)
    }
  }, [defaultName, cardholderName])

  const onElementChange = (event: StripeElementChangeEvent) => {
    setError(event.error?.message ?? '')
  }

  useImperativeHandle(
    ref,
    () => ({
      async confirmPayment(clientSecret, billing) {
        if (!stripe || !elements) {
          throw new Error('Stripe is still loading. Please try again.')
        }

        const cardNumber = elements.getElement(CardNumberElement)
        if (!cardNumber) {
          throw new Error('Card fields are not ready yet.')
        }

        const nameOnCard = cardholderName.trim() || billing.name
        if (!nameOnCard) {
          throw new Error('Enter the name on the card.')
        }

        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardNumber as StripeCardNumberElement,
            billing_details: {
              name: nameOnCard,
              email: billing.email,
              phone: billing.phone || undefined,
            },
          },
        })

        if (result.error) {
          throw new Error(result.error.message || 'Card payment failed')
        }

        const intent = result.paymentIntent
        if (!intent || intent.status !== 'succeeded') {
          throw new Error('Payment was not completed. Please try again.')
        }

        return { paymentIntentId: intent.id }
      },
    }),
    [stripe, elements, cardholderName],
  )

  return (
    <div className={cn(disabled && 'pointer-events-none opacity-60', className)}>
      <div className="space-y-3 bg-neutral-100/80 p-3 sm:p-3.5">
        <div className={fieldShell}>
          <div className="w-full py-3.5 [&_.StripeElement]:w-full">
            <CardNumberElement
              options={{
                style: elementStyle,
                placeholder: 'Card number',
                showIcon: true,
              }}
              onChange={onElementChange}
            />
          </div>
          <Lock
            className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={fieldShell}>
            <div className="w-full py-3.5 [&_.StripeElement]:w-full">
              <CardExpiryElement
                options={{
                  style: elementStyle,
                  placeholder: 'Expiration date (MM / YY)',
                }}
                onChange={onElementChange}
              />
            </div>
          </div>
          <div className={fieldShell}>
            <div className="w-full py-3.5 pr-8 [&_.StripeElement]:w-full">
              <CardCvcElement
                options={{
                  style: elementStyle,
                  placeholder: 'Security code',
                }}
                onChange={onElementChange}
              />
            </div>
            <span
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400"
              title="3-digit code on the back of your card (4 digits on the front for Amex)"
            >
              <CircleHelp className="size-3.5" aria-hidden />
            </span>
          </div>
        </div>

        <div className={fieldShell}>
          <input
            type="text"
            autoComplete="cc-name"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="Name on card"
            className="w-full bg-transparent py-3.5 text-[15px] text-neutral-950 outline-none placeholder:text-neutral-400"
          />
        </div>
      </div>

      {error ? (
        <p className="mt-3 px-1 text-xs text-red-600">{error}</p>
      ) : null}

      <label className="mt-5 flex cursor-pointer items-start gap-2.5 border-t border-neutral-200 px-1 pt-4 pb-1">
        <input
          type="checkbox"
          checked={useShippingAsBilling}
          onChange={(e) => setUseShippingAsBilling(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 rounded border-neutral-400 accent-neutral-950"
        />
        <span className="text-sm leading-snug text-neutral-800">
          Use shipping address as billing address
        </span>
      </label>
    </div>
  )
}

const StripeCardFieldsBase = forwardRef(StripeCardFieldsInner)
StripeCardFieldsBase.displayName = 'StripeCardFields'

let stripePromise: Promise<Stripe | null> | null = null

function getStripePromise() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()
    stripePromise = key ? loadStripe(key) : Promise.resolve(null)
  }
  return stripePromise
}

export function StripeElementsProvider({
  children,
}: {
  children: ReactNode
}) {
  const promise = useMemo(() => getStripePromise(), [])
  const [missingKey, setMissingKey] = useState(false)

  useEffect(() => {
    void promise.then((stripe) => {
      if (!stripe) setMissingKey(true)
    })
  }, [promise])

  if (missingKey) {
    return (
      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Stripe card fields need{' '}
        <code className="text-xs">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> in
        your environment.
      </div>
    )
  }

  return <Elements stripe={promise}>{children}</Elements>
}

function CardBrandBadges({ className }: { className?: string }) {
  const cardLogos = paymentProviderLogos.filter(
    (logo) => logo.id === 'visa' || logo.id === 'mastercard',
  )

  return (
    <div className={cn('flex items-center gap-1.5', className)} aria-hidden>
      {cardLogos.map((logo) => (
        <span
          key={logo.id}
          className="inline-flex h-7 min-w-[2.5rem] items-center justify-center overflow-hidden rounded border border-neutral-200 bg-white px-1.5"
        >
          <Image
            src={logo.src}
            alt=""
            width={44}
            height={28}
            className={cn('h-5 w-auto object-contain', logo.className)}
          />
        </span>
      ))}
    </div>
  )
}

export { CardBrandBadges }
export const StripeCardFields = StripeCardFieldsBase
