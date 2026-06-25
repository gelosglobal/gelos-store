import Image from 'next/image'
import { paymentProviderLogos } from '@/lib/payment-provider-logos'
import { cn } from '@/lib/utils'

export function CartPaymentMethods() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
      {paymentProviderLogos.map((method) => (
        <div
          key={method.id}
          className="flex h-9 min-w-[3.25rem] items-center justify-center rounded-lg border border-neutral-200/80 bg-white px-2.5"
        >
          <Image
            src={method.src}
            alt={method.label}
            width={88}
            height={28}
            className={cn('h-auto w-auto object-contain', method.className)}
          />
        </div>
      ))}
    </div>
  )
}
