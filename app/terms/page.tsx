import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/legal/legal-page-layout'
import { termsLastUpdated, termsSections } from '@/lib/legal-content'

export const metadata: Metadata = {
  title: 'Terms & Conditions | Gelos',
  description: 'Terms and conditions for using gelosglobal.com and purchasing Gelos products.',
}

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms & Conditions"
      description="Please read these terms carefully before using our website or placing an order."
      lastUpdated={termsLastUpdated}
      sections={termsSections}
      otherPage={{ label: 'Privacy Policy', href: '/privacy' }}
    />
  )
}
