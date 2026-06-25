'use client'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { PromotionsSettingsForm } from '@/components/admin/promotions-settings-form'
import { CartUpsellSettingsForm } from '@/components/admin/cart-upsell-settings-form'

export default function AdminCheckoutsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Checkouts"
        description="Free shipping rewards, promo codes, and cart incentives shown at checkout."
      />

      <PromotionsSettingsForm />
      <CartUpsellSettingsForm />
    </div>
  )
}
