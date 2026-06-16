'use client'

import { useEffect, useState } from 'react'
import type { AdminAffiliateInput } from '@/lib/admin/affiliate-input'
import type { StoreAffiliate } from '@/lib/types/affiliate'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

const emptyForm: AdminAffiliateInput = {
  name: '',
  code: '',
  email: '',
  phone: '',
  commissionPercent: 10,
  enabled: true,
  notes: '',
}

type AffiliateFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  affiliate?: StoreAffiliate | null
  onSubmit: (data: AdminAffiliateInput) => Promise<void>
  saving?: boolean
}

export function AffiliateFormDialog({
  open,
  onOpenChange,
  affiliate,
  onSubmit,
  saving = false,
}: AffiliateFormDialogProps) {
  const [form, setForm] = useState<AdminAffiliateInput>(emptyForm)
  const isEditing = Boolean(affiliate)

  useEffect(() => {
    if (!open) return
    if (affiliate) {
      setForm({
        name: affiliate.name,
        code: affiliate.code,
        email: affiliate.email,
        phone: affiliate.phone,
        commissionPercent: affiliate.commissionPercent,
        enabled: affiliate.enabled,
        notes: affiliate.notes,
      })
      return
    }
    setForm(emptyForm)
  }, [open, affiliate])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    await onSubmit(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit affiliate' : 'Add affiliate'}
          </DialogTitle>
          <DialogDescription>
            Create a unique referral code and commission rate. Customers who
            visit with <code>?ref=CODE</code> will be attributed to this
            affiliate at checkout.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="affiliate-name">Name</Label>
            <Input
              id="affiliate-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Ama Mensah"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="affiliate-code">Referral code</Label>
            <Input
              id="affiliate-code"
              value={form.code}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  code: event.target.value.toUpperCase(),
                }))
              }
              placeholder="AMA10"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="affiliate-email">Email</Label>
              <Input
                id="affiliate-email"
                type="email"
                value={form.email ?? ''}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="ama@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="affiliate-phone">Phone</Label>
              <Input
                id="affiliate-phone"
                value={form.phone ?? ''}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                placeholder="+233..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="affiliate-commission">Commission (%)</Label>
            <Input
              id="affiliate-commission"
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={form.commissionPercent}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  commissionPercent: Number(event.target.value),
                }))
              }
              required
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-neutral-900">Active</p>
              <p className="text-xs text-neutral-500">
                Inactive affiliates cannot earn new commissions.
              </p>
            </div>
            <Switch
              checked={form.enabled ?? true}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, enabled: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="affiliate-notes">Notes</Label>
            <Textarea
              id="affiliate-notes"
              value={form.notes ?? ''}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="Optional internal notes"
              className="min-h-[80px]"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? 'Saving…'
                : isEditing
                  ? 'Save changes'
                  : 'Create affiliate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
