'use client'

import { useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Plus,
  Search,
  Users,
} from 'lucide-react'
import { SubscriptionBadge } from '@/components/admin/subscription-badge'
import {
  adminCustomers,
  formatCustomerCount,
} from '@/lib/admin/customers-data'
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
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [summaryOpen, setSummaryOpen] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 50

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return adminCustomers
    return adminCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.location.toLowerCase().includes(q),
    )
  }, [search])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const totalCustomers = adminCustomers.length

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
            <Button variant="outline" size="sm" className="h-8">
              Import
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              More actions
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1 bg-neutral-950 hover:bg-neutral-800"
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
            100% of your customer base
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
              {paged.map((customer) => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  checked={selected.has(customer.id)}
                  onCheckedChange={(c) => toggleOne(customer.id, c)}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 text-sm text-neutral-600 sm:px-5">
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
            <span className="min-w-[3rem] px-2 text-center font-medium">
              {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, filtered.length)}
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
        GH₵{customer.totalSpent.toFixed(2)}
      </TableCell>
    </TableRow>
  )
}
