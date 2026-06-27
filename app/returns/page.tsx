import type { Metadata } from 'next'
import { HelpContentSections } from '@/components/help/help-content-sections'
import { HelpPageLayout } from '@/components/help/help-page-layout'
import { returnsSections } from '@/lib/help-content'

export const metadata: Metadata = {
  title: 'Returns & Refunds | Gelos',
  description:
    'How to request a return, exchange, or refund for your Gelos order.',
}

export default function ReturnsPage() {
  return (
    <HelpPageLayout
      currentHref="/returns"
      title="Returns & refunds"
      description="Our return policy and how to get help if something is not right with your order."
    >
      <HelpContentSections sections={returnsSections} />
    </HelpPageLayout>
  )
}
