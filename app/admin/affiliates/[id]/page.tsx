'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AffiliateDetailView } from '@/components/admin/affiliate-detail-view'
import { AffiliateFormDialog } from '@/components/admin/affiliate-form-dialog'
import type { AdminAffiliateInput } from '@/lib/admin/affiliate-input'
import { formatOrderTotal } from '@/lib/admin/order-format'
import type { AdminAffiliateDetail } from '@/lib/types/affiliate'

export default function AdminAffiliateDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const affiliateId = params.id

  const [affiliate, setAffiliate] = useState<AdminAffiliateDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false)
  const [processingPayout, setProcessingPayout] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadAffiliate = useCallback(async () => {
    if (!affiliateId) return

    try {
      const res = await fetch(`/api/admin/affiliates/${affiliateId}`, {
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAffiliate(data.affiliate ?? null)
    } catch {
      toast.error('Failed to load affiliate')
      setAffiliate(null)
    } finally {
      setLoading(false)
    }
  }, [affiliateId])

  useEffect(() => {
    setLoading(true)
    void loadAffiliate()
  }, [loadAffiliate])

  const handleUpdate = async (input: AdminAffiliateInput) => {
    if (!affiliateId) return

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/affiliates/${affiliateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save affiliate')
      toast.success('Affiliate updated')
      setDialogOpen(false)
      await loadAffiliate()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save affiliate',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!affiliate) return
    if (
      !window.confirm(
        `Delete affiliate ${affiliate.name} (${affiliate.code})? This cannot be undone.`,
      )
    ) {
      return
    }

    try {
      const res = await fetch(`/api/admin/affiliates/${affiliate.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to delete affiliate')
      toast.success('Affiliate deleted')
      router.push('/admin/affiliates')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete affiliate',
      )
    }
  }

  const handlePayout = async () => {
    if (!affiliate) return

    setProcessingPayout(true)
    try {
      const res = await fetch(`/api/admin/affiliates/${affiliate.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'payout' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to mark payout')
      toast.success(
        `Paid out ${formatOrderTotal('GHS', affiliate.pendingCommission)} to ${affiliate.name}`,
      )
      setPayoutDialogOpen(false)
      await loadAffiliate()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to mark payout',
      )
    } finally {
      setProcessingPayout(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (!affiliate) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center">
        <p className="text-sm text-neutral-600">Affiliate not found.</p>
      </div>
    )
  }

  return (
    <>
      <AffiliateDetailView
        affiliate={affiliate}
        payoutDialogOpen={payoutDialogOpen}
        processingPayout={processingPayout}
        onPayoutDialogOpenChange={setPayoutDialogOpen}
        onConfirmPayout={() => void handlePayout()}
        onEdit={() => setDialogOpen(true)}
        onDelete={() => void handleDelete()}
      />

      <AffiliateFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        affiliate={affiliate}
        onSubmit={handleUpdate}
        saving={saving}
      />
    </>
  )
}
