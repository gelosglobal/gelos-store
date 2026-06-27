import type { Metadata } from 'next'
import Image from 'next/image'
import { HelpContentSections } from '@/components/help/help-content-sections'
import { HelpPageLayout } from '@/components/help/help-page-layout'
import { paymentsSections } from '@/lib/help-content'
import { paymentProviderLogos } from '@/lib/payment-provider-logos'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Payments | Gelos',
  description:
    'Accepted payment methods, secure checkout, and help with payment issues at Gelos.',
}

export default function PaymentsPage() {
  return (
    <HelpPageLayout
      currentHref="/payments"
      title="Payments"
      description="How to pay securely at Gelos — cards, mobile money, and checkout help."
    >
      <div className="mb-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-bold text-neutral-950 sm:text-lg">We accept</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {paymentProviderLogos.map((method) => (
            <div
              key={method.id}
              className="flex h-11 min-w-[4rem] items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 px-3"
            >
              <Image
                src={method.src}
                alt={method.label}
                width={96}
                height={32}
                className={cn('h-auto w-auto object-contain', method.className)}
              />
            </div>
          ))}
        </div>
      </div>

      <HelpContentSections sections={paymentsSections} />
    </HelpPageLayout>
  )
}
