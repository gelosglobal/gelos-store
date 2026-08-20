import Image from 'next/image'
import { paymentProviderLogos } from '@/lib/payment-provider-logos'
import { cn } from '@/lib/utils'

const imageIds = ['visa', 'mastercard', 'momo'] as const

const networkChips = [
  { id: 'telecel', label: 'Telecel', className: 'bg-[#e60000] text-white' },
  {
    id: 'airteltigo',
    label: 'AirtelTigo',
    className: 'bg-[#001a4d] text-white',
  },
] as const

type PaystackPaymentBadgesProps = {
  className?: string
}

/**
 * Visual hint that Pay online = Paystack (cards + MTN / Telecel / AirtelTigo MoMo).
 * Actual channels are chosen on Paystack’s hosted page after redirect.
 */
export function PaystackPaymentBadges({ className }: PaystackPaymentBadgesProps) {
  const logos = imageIds
    .map((id) => paymentProviderLogos.find((logo) => logo.id === id))
    .filter((logo): logo is (typeof paymentProviderLogos)[number] => Boolean(logo))

  return (
    <span
      className={cn('flex flex-wrap items-center gap-1.5', className)}
      aria-label="Visa, Mastercard, MTN MoMo, Telecel, AirtelTigo"
    >
      {logos.map((logo) => (
        <span
          key={logo.id}
          className="inline-flex h-7 items-center justify-center overflow-hidden rounded border border-neutral-200 bg-white px-1.5"
        >
          <Image
            src={logo.src}
            alt=""
            width={56}
            height={28}
            className={cn('h-4 w-auto object-contain', logo.className)}
          />
        </span>
      ))}
      {networkChips.map((chip) => (
        <span
          key={chip.id}
          className={cn(
            'inline-flex h-7 items-center justify-center rounded px-1.5 text-[9px] font-semibold leading-none tracking-tight',
            chip.className,
          )}
        >
          {chip.label}
        </span>
      ))}
    </span>
  )
}
