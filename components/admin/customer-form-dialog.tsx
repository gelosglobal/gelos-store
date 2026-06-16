'use client'

import { useEffect, useState } from 'react'
import type { AdminCustomerInput } from '@/lib/admin/customer-input'
import type { EmailSubscription } from '@/lib/types/customer'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const emptyForm: AdminCustomerInput = {
  name: '',
  email: '',
  phone: '',
  location: '',
  emailSubscription: 'Not subscribed',
}

type CustomerFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AdminCustomerInput) => Promise<void>
  saving?: boolean
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  onSubmit,
  saving = false,
}: CustomerFormDialogProps) {
  const [form, setForm] = useState<AdminCustomerInput>(emptyForm)

  useEffect(() => {
    if (open) setForm(emptyForm)
  }, [open])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    await onSubmit(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add customer</DialogTitle>
          <DialogDescription>
            Create a customer profile manually. Add an email or phone number so
            they can be matched to future orders.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer-name">Name</Label>
            <Input
              id="customer-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Ama Mensah"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-email">Email</Label>
            <Input
              id="customer-email"
              type="email"
              value={form.email ?? ''}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="ama@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-phone">Phone</Label>
            <Input
              id="customer-phone"
              value={form.phone ?? ''}
              onChange={(event) =>
                setForm((current) => ({ ...current, phone: event.target.value }))
              }
              placeholder="+233201234567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-location">Location</Label>
            <Input
              id="customer-location"
              value={form.location ?? ''}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  location: event.target.value,
                }))
              }
              placeholder="Accra, Ghana"
            />
          </div>

          <div className="space-y-2">
            <Label>Email subscription</Label>
            <Select
              value={form.emailSubscription ?? 'Not subscribed'}
              onValueChange={(value: EmailSubscription) =>
                setForm((current) => ({
                  ...current,
                  emailSubscription: value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Subscribed">Subscribed</SelectItem>
                <SelectItem value="Not subscribed">Not subscribed</SelectItem>
              </SelectContent>
            </Select>
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
            <Button
              type="submit"
              className="bg-neutral-950 hover:bg-neutral-800"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Add customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
