'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Copy,
  Link2,
  MoreHorizontal,
  Plus,
  Search,
  Share2,
  ShoppingCart,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { AffiliateFormDialog } from '@/components/admin/affiliate-form-dialog'
import type { AdminAffiliateInput } from '@/lib/admin/affiliate-input'
import { formatOrderTotal } from '@/lib/admin/order-format'
import type { StoreAffiliate } from '@/lib/types/affiliate'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
type AffiliateStats = {
  totalAffiliates: number
  activeAffiliates: number
  totalOrders: number
  pendingCommission: number
  paidCommission: number
}

export default function AdminAffiliatesPage() {
  const router = useRouter()
  const [affiliates, setAffiliates] = useState<StoreAffiliate[]>([])
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAffiliate, setEditingAffiliate] = useState<StoreAffiliate | null>(
    null,
  )
  const [saving, setSaving] = useState(false)

  const loadAffiliates = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/affiliates', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAffiliates(data.affiliates ?? [])
      setStats(data.stats ?? null)
    } catch {
      toast.error('Failed to load affiliates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAffiliates()
  }, [loadAffiliates])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return affiliates
    return affiliates.filter(
      (affiliate) =>
        affiliate.name.toLowerCase().includes(q) ||
        affiliate.code.toLowerCase().includes(q) ||
        affiliate.email.toLowerCase().includes(q) ||
        affiliate.phone.includes(q),
    )
  }, [affiliates, search])

  const handleCreateOrUpdate = async (input: AdminAffiliateInput) => {
    setSaving(true)
    try {
      const isEditing = Boolean(editingAffiliate)
      const res = await fetch(
        isEditing
          ? `/api/admin/affiliates/${editingAffiliate!.id}`
          : '/api/admin/affiliates',
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save affiliate')

      toast.success(isEditing ? 'Affiliate updated' : 'Affiliate created')
      setDialogOpen(false)
      setEditingAffiliate(null)
      await loadAffiliates()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save affiliate',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (affiliate: StoreAffiliate) => {
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
      await loadAffiliates()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete affiliate',
      )
    }
  }

  const openAffiliate = (affiliateId: string) => {
    router.push(`/admin/affiliates/${affiliateId}`)
  }

  const copyReferralLink = async (affiliate: StoreAffiliate) => {
    try {
      await navigator.clipboard.writeText(affiliate.referralUrl)
      toast.success(`Copied link for ${affiliate.code}`)
    } catch {
      toast.error('Could not copy link')
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Affiliates"
        description="Manage referral partners, track attributed orders, and pay out commissions."
      >
        <Button
          className="bg-neutral-950 hover:bg-neutral-800"
          onClick={() => {
            setEditingAffiliate(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Add affiliate
        </Button>
      </AdminPageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Active affiliates"
          value={stats?.activeAffiliates ?? '—'}
          hint={`${stats?.totalAffiliates ?? 0} total`}
          icon={Users}
        />
        <AdminStatCard
          label="Attributed orders"
          value={stats?.totalOrders ?? '—'}
          hint="From affiliate referrals"
          icon={ShoppingCart}
        />
        <AdminStatCard
          label="Pending commission"
          value={
            stats
              ? formatOrderTotal('GHS', stats.pendingCommission)
              : '—'
          }
          hint="Ready to pay out"
          icon={Wallet}
        />
        <AdminStatCard
          label="Paid commission"
          value={
            stats ? formatOrderTotal('GHS', stats.paidCommission) : '—'
          }
          hint="Lifetime payouts"
          icon={Share2}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 px-4 py-3 sm:px-5">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Search affiliates"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-9 border-neutral-200 pl-9 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Affiliate</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center text-sm text-neutral-500"
                  >
                    Loading affiliates…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center text-sm text-neutral-500"
                  >
                    {search
                      ? 'No affiliates match your search.'
                      : 'No affiliates yet. Create your first partner to start tracking referrals.'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((affiliate) => (
                  <TableRow
                    key={affiliate.id}
                    className="cursor-pointer hover:bg-neutral-50/80"
                    onClick={() => openAffiliate(affiliate.id)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-neutral-950">
                          {affiliate.name}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {affiliate.email || affiliate.phone || '—'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {affiliate.code}
                    </TableCell>
                    <TableCell>{affiliate.commissionPercent}%</TableCell>
                    <TableCell className="text-right">
                      {affiliate.totalOrders}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatOrderTotal('GHS', affiliate.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatOrderTotal('GHS', affiliate.pendingCommission)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={affiliate.enabled ? 'default' : 'secondary'}
                        className={
                          affiliate.enabled
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                            : ''
                        }
                      >
                        {affiliate.enabled ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4" onClick={(event) => event.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openAffiliate(affiliate.id)}
                          >
                            <Link2 className="h-4 w-4" />
                            View affiliate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => copyReferralLink(affiliate)}
                          >
                            <Copy className="h-4 w-4" />
                            Copy referral link
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingAffiliate(affiliate)
                              setDialogOpen(true)
                            }}
                          >
                            <Link2 className="h-4 w-4" />
                            Edit affiliate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(affiliate)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AffiliateFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingAffiliate(null)
        }}
        affiliate={editingAffiliate}
        onSubmit={handleCreateOrUpdate}
        saving={saving}
      />
    </div>
  )
}
