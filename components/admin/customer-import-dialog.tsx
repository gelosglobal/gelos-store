'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Download, Upload } from 'lucide-react'
import {
  CUSTOMER_IMPORT_TEMPLATE,
  parseCustomerCsv,
  type ParsedCustomerImportRow,
} from '@/lib/admin/customer-import'
import { formatOrderTotal } from '@/lib/admin/order-format'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type CustomerImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (rows: ParsedCustomerImportRow[]) => Promise<void>
  importing?: boolean
}

type ReviewState = {
  fileName: string
  rows: ParsedCustomerImportRow[]
  errors: Array<{ rowNumber: number; message: string }>
}

export function CustomerImportDialog({
  open,
  onOpenChange,
  onImport,
  importing = false,
}: CustomerImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [review, setReview] = useState<ReviewState | null>(null)
  const [selectedRowNumbers, setSelectedRowNumbers] = useState<Set<number>>(
    new Set(),
  )

  const resetState = () => {
    setReview(null)
    setSelectedRowNumbers(new Set())
  }

  useEffect(() => {
    if (!open) resetState()
  }, [open])

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const text = await file.text()
    const parsed = parseCustomerCsv(text)

    setReview({
      fileName: file.name,
      rows: parsed.rows,
      errors: parsed.errors,
    })
    setSelectedRowNumbers(new Set(parsed.rows.map((row) => row.rowNumber)))
  }

  const selectedRows = useMemo(
    () =>
      review?.rows.filter((row) => selectedRowNumbers.has(row.rowNumber)) ?? [],
    [review, selectedRowNumbers],
  )

  const allSelected =
    (review?.rows.length ?? 0) > 0 &&
    review!.rows.every((row) => selectedRowNumbers.has(row.rowNumber))

  const toggleAll = (checked: boolean) => {
    if (!review) return
    setSelectedRowNumbers(
      checked ? new Set(review.rows.map((row) => row.rowNumber)) : new Set(),
    )
  }

  const toggleOne = (rowNumber: number, checked: boolean) => {
    setSelectedRowNumbers((prev) => {
      const next = new Set(prev)
      if (checked) next.add(rowNumber)
      else next.delete(rowNumber)
      return next
    })
  }

  const handleImportSelected = async () => {
    if (!selectedRows.length) return
    await onImport(selectedRows)
  }

  const downloadTemplate = () => {
    const blob = new Blob([CUSTOMER_IMPORT_TEMPLATE], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'gelos-customers-template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Import customers</DialogTitle>
          <DialogDescription>
            {review
              ? `Review ${review.fileName} and choose which customers to import. Duplicates are skipped automatically.`
              : 'Upload a CSV file, then choose which customers to import. Shopify exports are supported.'}
          </DialogDescription>
        </DialogHeader>

        {!review ? (
          <div className="space-y-4 overflow-y-auto">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-medium text-neutral-900">
                Supported columns
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                Name (or First Name + Last Name), Email, Phone, Location, Email
                subscription / Accepts Email Marketing
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 gap-2"
                onClick={downloadTemplate}
              >
                <Download className="h-4 w-4" />
                Download template
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-900">CSV preview</p>
              <Textarea
                readOnly
                value={CUSTOMER_IMPORT_TEMPLATE}
                className="min-h-[120px] font-mono text-xs"
              />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Choose CSV file
            </Button>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
            {review.errors.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">
                      {review.errors.length} row
                      {review.errors.length === 1 ? '' : 's'} could not be
                      parsed
                    </p>
                    <ul className="mt-1 space-y-0.5 text-amber-900">
                      {review.errors.slice(0, 4).map((entry) => (
                        <li key={`${entry.rowNumber}-${entry.message}`}>
                          Row {entry.rowNumber}: {entry.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {review.rows.length === 0 ? (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-600">
                No valid customers found in this file.
              </div>
            ) : (
              <div className="min-h-0 overflow-hidden rounded-xl border border-neutral-200">
                <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-2">
                  <p className="text-sm font-medium text-neutral-900">
                    {selectedRows.length} of {review.rows.length} selected
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => toggleAll(!allSelected)}
                    >
                      {allSelected ? 'Deselect all' : 'Select all'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose another file
                    </Button>
                  </div>
                </div>
                <div className="max-h-[min(50vh,420px)] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={(checked) =>
                              toggleAll(checked === true)
                            }
                            aria-label="Select all customers"
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Amount spent</TableHead>
                        <TableHead>Subscription</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {review.rows.map((row) => (
                        <TableRow key={row.rowNumber}>
                          <TableCell>
                            <Checkbox
                              checked={selectedRowNumbers.has(row.rowNumber)}
                              onCheckedChange={(checked) =>
                                toggleOne(row.rowNumber, checked === true)
                              }
                              aria-label={`Select ${row.name}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {row.name}
                          </TableCell>
                          <TableCell className="text-neutral-600">
                            {row.email || '—'}
                          </TableCell>
                          <TableCell className="text-neutral-600">
                            {row.phone || '—'}
                          </TableCell>
                          <TableCell className="max-w-[180px] truncate text-neutral-600">
                            {row.location || '—'}
                          </TableCell>
                          <TableCell className="text-right text-neutral-600">
                            {row.lifetimeOrders ?? 0}
                          </TableCell>
                          <TableCell className="text-right text-neutral-600">
                            {formatOrderTotal(
                              row.lifetimeCurrency ?? 'GHS',
                              row.lifetimeSpent ?? 0,
                            )}
                          </TableCell>
                          <TableCell className="text-neutral-600">
                            {row.emailSubscription ?? '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          {review ? (
            <Button
              type="button"
              variant="outline"
              onClick={resetState}
              disabled={importing}
            >
              Back
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={importing}
            >
              Close
            </Button>
            {review && review.rows.length > 0 && (
              <Button
                type="button"
                onClick={handleImportSelected}
                disabled={importing || selectedRows.length === 0}
              >
                {importing
                  ? 'Importing…'
                  : `Import ${selectedRows.length} customer${selectedRows.length === 1 ? '' : 's'}`}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
