import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/legal/legal-page-layout'
import { privacyLastUpdated, privacySections } from '@/lib/legal-content'

export const metadata: Metadata = {
  title: 'Privacy Policy | Gelos',
  description: 'How Gelos Global collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="How we handle your personal data when you shop with Gelos or use our website."
      lastUpdated={privacyLastUpdated}
      sections={privacySections}
      otherPage={{ label: 'Terms & Conditions', href: '/terms' }}
    />
  )
}
