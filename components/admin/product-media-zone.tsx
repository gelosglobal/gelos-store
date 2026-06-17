'use client'

import { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { isExternalImageUrl } from '@/lib/image-url'
import { useUploadThing } from '@/lib/uploadthing'
import { cn } from '@/lib/utils'

type ProductMediaZoneProps = {
  value: string
  onChange: (url: string) => void
}

export function ProductMediaZone({ value, onChange }: ProductMediaZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const { startUpload, isUploading } = useUploadThing('productImage', {
    onClientUploadComplete: (res) => {
      const file = res?.[0]
      const url = file?.serverData?.url ?? file?.ufsUrl ?? file?.url
      if (url) {
        onChange(url)
        toast.success('Image uploaded')
      }
    },
    onUploadError: (error) => {
      toast.error(error.message || 'Upload failed')
    },
  })

  const uploadFiles = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files?.length) return
      await startUpload(Array.from(files))
    },
    [startUpload],
  )

  const hasImage = Boolean(value?.trim() && value !== '/placeholder.svg')

  return (
    <div className="space-y-3">
      {hasImage && (
        <div className="relative inline-block overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <div className="relative h-24 w-24">
            <Image
              src={value}
              alt="Product"
              fill
              className="object-contain p-2"
              unoptimized={isExternalImageUrl(value)}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="absolute bottom-1 right-1 h-7 text-xs"
            onClick={() => onChange('')}
          >
            Remove
          </Button>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          void uploadFiles(e.dataTransfer.files)
        }}
        className={cn(
          'flex min-h-[140px] flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center transition-colors',
          dragOver
            ? 'border-neutral-400 bg-neutral-50'
            : 'border-neutral-300 bg-neutral-50/50',
          isUploading && 'pointer-events-none opacity-70',
        )}
      >
        {isUploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        ) : (
          <>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-white">
              <ImagePlus className="h-5 w-5 text-neutral-500" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-white"
                onClick={() => inputRef.current?.click()}
              >
                Upload new
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-neutral-600"
                onClick={() => inputRef.current?.click()}
              >
                Select existing
              </Button>
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              Accepts images. PNG or JPG up to 8MB.
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => void uploadFiles(e.target.files)}
        />
      </div>
    </div>
  )
}
