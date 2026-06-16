'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Plus,
  Search,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { CustomerFormDialog } from '@/components/admin/customer-form-dialog'
import { CustomerImportDialog } from '@/components/admin/customer-import-dialog'
import { SubscriptionBadge } from '@/components/admin/subscription-badge'
import type { AdminCustomerInput } from '@/lib/admin/customer-input'
import { formatOrderTotal } from '@/lib/admin/order-format'
import { formatCustomerCount } from '@/lib/admin/customers-data'
import type { StoreCustomer } from '@/lib/types/customer'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<StoreCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [summaryOpen, setSummaryOpen] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 50

  const loadCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/customers', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCustomers(data.customers ?? [])
    } catch {
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadCustomers()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [loadCustomers])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.location.toLowerCase().includes(q),
    )
  }, [customers, search])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const totalCustomers = customers.length

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(paged.map((c) => c.id)) : new Set())
  }

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const allSelected =
    paged.length > 0 && paged.every((c) => selected.has(c.id))

  const handleAddCustomer = async (input: AdminCustomerInput) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to add customer')

      toast.success('Customer added')
      setAddOpen(false)
      await loadCustomers()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to add customer',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleImportCustomers = async (file: File) => {
    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/customers/import', {
        method: 'POST',
        body: formData,
      })
      const data = (await res.json()) as {
        error?: string
        created?: number
        skipped?: number
        errors?: Array<{ rowNumber: number; message: string }>
      }

      if (!res.ok) throw new Error(data.error ?? 'Failed to import customers')

      const created = data.created ?? 0
      const skipped = data.skipped ?? 0
      const rowErrors = data.errors ?? []

      if (created > 0) {
        toast.success(
          `Imported ${created} customer${created === 1 ? '' : 's'}${skipped ? ` (${skipped} skipped)` : ''}`,
        )
      } else if (skipped > 0) {
        toast.message('No new customers imported', {
          description: `${skipped} duplicate or empty row${skipped === 1 ? '' : 's'} skipped.`,
        })
      } else {
        toast.error('No customers were imported')
      }

      if (rowErrors.length > 0) {
        toast.error(
          `${rowErrors.length} row${rowErrors.length === 1 ? '' : 's'} had errors`,
          {
            description: rowErrors
              .slice(0, 3)
              .map((entry) => `Row ${entry.rowNumber}: ${entry.message}`)
              .join(' · '),
          },
        )
      }

      if (created > 0) {
        setImportOpen(false)
        await loadCustomers()
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to import customers',
      )
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-neutral-700" />
            <h1 className="text-lg font-semibold text-neutral-950">Customers</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="h-8">
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setImportOpen(true)}
            >
              Import
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              More actions
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1 bg-neutral-950 hover:bg-neutral-800"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add customer
            </Button>
          </div>
        </div>

        {/* Summary bar */}
        <button
          type="button"
          onClick={() => setSummaryOpen((o) => !o)}
          className="flex w-full items-center justify-between border-b border-neutral-200 bg-neutral-50/80 px-4 py-2.5 text-left text-sm text-neutral-600 hover:bg-neutral-50 sm:px-5"
        >
          <span>
            <strong className="font-semibold text-neutral-950">
              {formatCustomerCount(totalCustomers)} customers
            </strong>
            <span className="text-neutral-400"> · </span>
            {totalCustomers === 0
              ? 'No checkout customers yet'
              : '100% of your customer base'}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform ${summaryOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-2 sm:px-5">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Search customers"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="h-9 border-neutral-200 pl-9 text-sm"
            />
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(c) => toggleAll(Boolean(c))}
                    aria-label="Select all customers"
                  />
                </TableHead>
                <TableHead className="font-semibold text-neutral-600">
                  Customer name
                </TableHead>
                <TableHead className="font-semibold text-neutral-600">
                  Email subscription
                </TableHead>
                <TableHead className="font-semibold text-neutral-600">
                  Location
                </TableHead>
                <TableHead className="text-right font-semibold text-neutral-600">
                  Orders
                </TableHead>
                <TableHead className="pr-4 text-right font-semibold text-neutral-600">
                  Amount spent
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-12 text-center text-sm text-neutral-500"
                  >
                    Loading customers…
                  </TableCell>
                </TableRow>
              ) : paged.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-12 text-center text-sm text-neutral-500"
                  >
                    {search
                      ? 'No customers match your search.'
                      : 'No customers yet. They will appear here after checkout.'}
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((customer) => (
                  <CustomerRow
                    key={customer.id}
                    customer={customer}
                    checked={selected.has(customer.id)}
                    onCheckedChange={(c) => toggleOne(customer.id, c)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 text-sm text-neutral-600 sm:px-5">
          <span>
            {filtered.length === 0
              ? '0 customers'
              : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} of ${filtered.length}`}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[3rem] text-center font-medium">
              {page}-{pageCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= pageCount}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <CustomerFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAddCustomer}
        saving={saving}
      />

      <CustomerImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImportCustomers}
        importing={importing}
      />
    </div>
  )
}

function CustomerRow({
  customer,
  checked,
  onCheckedChange,
}: {
  customer: StoreCustomer
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  const subtitle = customer.email || customer.phone

  return (
    <TableRow className="hover:bg-neutral-50/80">
      <TableCell className="pl-4">
        <Checkbox
          checked={checked}
          onCheckedChange={(c) => onCheckedChange(Boolean(c))}
          aria-label={`Select ${customer.name}`}
        />
      </TableCell>
      <TableCell>
        <div className="min-w-[140px]">
          <p className="font-medium text-neutral-950">{customer.name}</p>
          {subtitle && (
            <p className="text-sm text-neutral-500">{subtitle}</p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <SubscriptionBadge status={customer.emailSubscription} />
      </TableCell>
      <TableCell className="text-neutral-600">{customer.location}</TableCell>
      <TableCell className="text-right text-neutral-950">
        {customer.orders}
      </TableCell>
      <TableCell className="pr-4 text-right font-medium text-neutral-950">
        {formatOrderTotal(customer.currency, customer.totalSpent)}
      </TableCell>
    </TableRow>
  )
}
