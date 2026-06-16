'use client'

import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { CUSTOMER_IMPORT_TEMPLATE } from '@/lib/admin/customer-import'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

type CustomerImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (file: File) => Promise<void>
  importing?: boolean
}

export function CustomerImportDialog({
  open,
  onOpenChange,
  onImport,
  importing = false,
}: CustomerImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFileName, setSelectedFileName] = useState('')

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return
    setSelectedFileName(file.name)
    await onImport(file)
    event.target.value = ''
    setSelectedFileName('')
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import customers</DialogTitle>
          <DialogDescription>
            Upload a CSV file with customer details. Duplicate emails or phone
            numbers are skipped automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-sm font-medium text-neutral-900">
              Required columns
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              Name, Email, Phone, Location, Email subscription
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
            {importing
              ? 'Importing…'
              : selectedFileName
                ? `Importing ${selectedFileName}…`
                : 'Choose CSV file'}
          </Button>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
