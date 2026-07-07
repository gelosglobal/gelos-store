import type { Metadata } from 'next'
import { AffiliateSettingsView } from '@/components/affiliate/affiliate-settings-view'

export const metadata: Metadata = {
  title: 'Settings | Affiliate dashboard | Gelos',
  description: 'Manage your affiliate payout settings.',
}

export default function AffiliateSettingsPage() {
  return <AffiliateSettingsView />
}
