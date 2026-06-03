'use client'

import { useCallback, useRef } from 'react'
import Image from 'next/image'
import { GripVertical, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { isExternalImageUrl } from '@/lib/image-url'
import { useUploadThing } from '@/lib/uploadthing'
import { cn } from '@/lib/utils'

export type ProductImageUrlsFieldProps = {
  value: string[]
  onChange: (urls: string[]) => void
  maxImages: number
  description: string
  addButtonLabel: string
  listItemAltPrefix?: string
}

export function ProductImageUrlsField({
  value,
  onChange,
  maxImages,
  description,
  addButtonLabel,
  listItemAltPrefix = 'Image',
}: ProductImageUrlsFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const { startUpload, isUploading } = useUploadThing('productImage', {
    onClientUploadComplete: (res) => {
      const urls = (res ?? [])
        .map((file) => file?.serverData?.url ?? file?.ufsUrl ?? file?.url)
        .filter((url): url is string => Boolean(url))
      if (urls.length === 0) return
      onChange([...value, ...urls].slice(0, maxImages))
      toast.success('Image added')
    },
    onUploadError: (error) => {
      toast.error(error.message || 'Upload failed')
    },
  })

  const uploadFiles = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files?.length) return
      const remaining = maxImages - value.length
      if (remaining <= 0) {
        toast.error(`Maximum ${maxImages} images`)
        return
      }
      await startUpload(Array.from(files).slice(0, remaining))
    },
    [maxImages, startUpload, value.length],
  )

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= value.length) return
    const next = [...value]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const atLimit = value.length >= maxImages

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-neutral-500">{description}</p>

      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((src, index) => (
            <li
              key={`${src}-${index}`}
              className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white p-2"
            >
              <div className="flex flex-col gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-neutral-400"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label="Move up"
                >
                  <GripVertical className="h-3.5 w-3.5 rotate-90" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-neutral-400"
                  disabled={index === value.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Move down"
                >
                  <GripVertical className="h-3.5 w-3.5 -rotate-90" />
                </Button>
              </div>
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
                <Image
                  src={src}
                  alt={`${listItemAltPrefix} ${index + 1}`}
                  fill
                  className="object-contain p-1"
                  unoptimized={isExternalImageUrl(src)}
                />
              </div>
              <span className="min-w-0 flex-1 truncate text-xs text-neutral-500">
                {src}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-neutral-500 hover:text-red-600"
                onClick={() => remove(index)}
                aria-label="Remove image"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div
        className={cn(
          'flex min-h-[100px] flex-col items-center justify-center rounded-lg border border-dashed px-4 py-6 text-center',
          atLimit
            ? 'border-neutral-200 bg-neutral-50/80 opacity-60'
            : 'border-neutral-300 bg-neutral-50/50',
          isUploading && 'pointer-events-none opacity-70',
        )}
      >
        {isUploading ? (
          <Loader2 className="h-7 w-7 animate-spin text-neutral-400" />
        ) : (
          <>
            <ImagePlus className="mb-2 h-6 w-6 text-neutral-400" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="bg-white"
              disabled={atLimit}
              onClick={() => inputRef.current?.click()}
            >
              {addButtonLabel}
            </Button>
            <p className="mt-2 text-xs text-neutral-500">
              {value.length}/{maxImages} images · PNG or JPG up to 8MB
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => void uploadFiles(e.target.files)}
        />
      </div>
    </div>
  )
}
