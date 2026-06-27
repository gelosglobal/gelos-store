import type { Metadata } from 'next'
import Link from 'next/link'
import { FaqList } from '@/components/help/faq-list'
import { HelpPageLayout } from '@/components/help/help-page-layout'
import { faqItems } from '@/lib/help-content'

export const metadata: Metadata = {
  title: 'FAQs | Gelos',
  description:
    'Frequently asked questions about Gelos orders, delivery, products, promo codes, and support.',
}

export default function FaqsPage() {
  return (
    <HelpPageLayout
      currentHref="/faqs"
      title="Frequently asked questions"
      description="Quick answers about shopping with Gelos — orders, delivery, products, and more."
    >
      <FaqList items={faqItems} />

      <p className="mt-6 text-sm text-neutral-600">
        Looking for a store near you?{' '}
        <Link href="/find-a-store" className="font-semibold text-neutral-950 underline-offset-4 hover:underline">
          Find a store
        </Link>
        .
      </p>
    </HelpPageLayout>
  )
}
