import type { Metadata } from 'next'
import { AffiliatePortalShell } from '@/components/affiliate/affiliate-portal-shell'

export const metadata: Metadata = {
  title: 'Affiliate dashboard | Gelos',
  description: 'Track referrals, commissions, and orders.',
}

export default function AffiliateDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AffiliatePortalShell>{children}</AffiliatePortalShell>
}
