'use client'

import { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isExternalImageUrl } from '@/lib/image-url'
import { useUploadThing, type UploadEndpoint } from '@/lib/uploadthing'
import { cn } from '@/lib/utils'

type ImageUploadFieldProps = {
  value: string
  onChange: (url: string) => void
  endpoint: UploadEndpoint
  label?: string
  hint?: string
  allowManualUrl?: boolean
  className?: string
}

export function ImageUploadField({
  value,
  onChange,
  endpoint,
  label = 'Image',
  hint = 'PNG or JPG up to 8MB. Stored on UploadThing.',
  allowManualUrl = true,
  className,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      const file = res?.[0]
      const url =
        file?.serverData?.url ?? file?.ufsUrl ?? file?.url
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

  const previewSrc = value?.trim() || null
  const showPreview = Boolean(previewSrc)

  return (
    <div className={cn('space-y-3', className)}>
      <Label>{label}</Label>

      {showPreview && previewSrc && (
        <div className="relative overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
          <div className="relative aspect-square max-h-40 w-full sm:max-w-[200px]">
            <Image
              src={previewSrc}
              alt="Preview"
              fill
              className={
                previewSrc.endsWith('.png') ||
                isExternalImageUrl(previewSrc)
                  ? 'object-contain p-3'
                  : 'object-cover'
              }
              sizes="200px"
              unoptimized={isExternalImageUrl(previewSrc)}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 rounded-full bg-white shadow-sm"
            onClick={() => onChange('')}
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
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
        onClick={() => !isUploading && inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors',
          dragOver
            ? 'border-neutral-950 bg-neutral-50'
            : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50',
          isUploading && 'pointer-events-none opacity-70',
        )}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
            <p className="text-sm font-medium text-neutral-700">Uploading…</p>
          </>
        ) : (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
              <ImagePlus className="h-5 w-5 text-neutral-600" />
            </div>
            <p className="text-sm font-medium text-neutral-900">
              Drop an image or click to browse
            </p>
            <p className="text-xs text-neutral-500">{hint}</p>
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

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 bg-white"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-3.5 w-3.5" />
        Choose file
      </Button>

      {allowManualUrl && (
        <div className="space-y-1.5">
          <p className="text-xs text-neutral-500">
            Or paste a URL (UploadThing, /gelos/…, etc.)
          </p>
          <Input
            placeholder="https://utfs.io/… or /gelos/product.png"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-white font-mono text-xs"
          />
        </div>
      )}
    </div>
  )
}
