'use client'

import { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import { Film, GripVertical, ImagePlus, Loader2, Trash2, Video } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { isExternalImageUrl } from '@/lib/image-url'
import { prepareGalleryVideo } from '@/lib/prepare-gallery-video'
import {
  encodeGalleryVideo,
  parseGalleryMediaItem,
} from '@/lib/product-gallery-images'
import { useUploadThing } from '@/lib/uploadthing'
import { cn } from '@/lib/utils'

const MAX_GALLERY_ITEMS = 10

type ProductGalleryImagesFieldProps = {
  value: string[]
  onChange: (urls: string[]) => void
}

type UploadPhase = 'idle' | 'optimizing' | 'uploading'

export function ProductGalleryImagesField({
  value,
  onChange,
}: ProductGalleryImagesFieldProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')

  const appendItems = useCallback(
    (entries: string[]) => {
      if (entries.length === 0) return
      onChange([...value, ...entries].slice(0, MAX_GALLERY_ITEMS))
    },
    [onChange, value],
  )

  const resetUploadState = useCallback(() => {
    setUploadPhase('idle')
    setUploadProgress(0)
    setStatusMessage('')
  }, [])

  const { startUpload: startImageUpload, isUploading: isUploadingImage } =
    useUploadThing('productImage', {
      onUploadBegin: () => {
        setUploadPhase('uploading')
        setUploadProgress(0)
        setStatusMessage('Uploading image…')
      },
      onUploadProgress: (progress) => {
        setUploadProgress(progress)
      },
      uploadProgressGranularity: 'fine',
      onClientUploadComplete: (res) => {
        const urls = (res ?? [])
          .map((file) => file?.serverData?.url ?? file?.ufsUrl ?? file?.url)
          .filter((url): url is string => Boolean(url))
        if (urls.length === 0) return
        appendItems(urls)
        toast.success('Image added')
        resetUploadState()
      },
      onUploadError: (error) => {
        resetUploadState()
        toast.error(error.message || 'Image upload failed')
      },
    })

  const { startUpload: startVideoUpload, isUploading: isUploadingVideo } =
    useUploadThing('productVideo', {
      onBeforeUploadBegin: async (files) => {
        setUploadPhase('optimizing')
        setUploadProgress(0)
        setStatusMessage('Preparing video…')

        const prepared = await Promise.all(
          files.map((file) =>
            prepareGalleryVideo(file, (progress) => {
              setUploadPhase('optimizing')
              setStatusMessage(progress.message)
              setUploadProgress(progress.percent ?? 0)
            }),
          ),
        )

        const compressedCount = prepared.filter((item) => item.wasCompressed).length
        if (compressedCount > 0) {
          toast.message('Video optimized before upload')
        }

        return prepared.map((item) => item.file)
      },
      onUploadBegin: () => {
        setUploadPhase('uploading')
        setUploadProgress(0)
        setStatusMessage('Uploading video…')
      },
      onUploadProgress: (progress) => {
        setUploadPhase('uploading')
        setUploadProgress(progress)
        setStatusMessage(`Uploading video… ${progress}%`)
      },
      uploadProgressGranularity: 'fine',
      onClientUploadComplete: (res) => {
        const urls = (res ?? [])
          .map((file) => file?.serverData?.url ?? file?.ufsUrl ?? file?.url)
          .filter((url): url is string => Boolean(url))
          .map(encodeGalleryVideo)
        if (urls.length === 0) return
        appendItems(urls)
        toast.success('Video added')
        resetUploadState()
      },
      onUploadError: (error) => {
        resetUploadState()
        toast.error(error.message || 'Video upload failed')
      },
    })

  const isUploading =
    isUploadingImage || isUploadingVideo || uploadPhase !== 'idle'

  const uploadImages = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files?.length) return
      const remaining = MAX_GALLERY_ITEMS - value.length
      if (remaining <= 0) {
        toast.error(`Maximum ${MAX_GALLERY_ITEMS} gallery items`)
        return
      }
      await startImageUpload(Array.from(files).slice(0, remaining))
    },
    [startImageUpload, value.length],
  )

  const uploadVideos = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files?.length) return
      const remaining = MAX_GALLERY_ITEMS - value.length
      if (remaining <= 0) {
        toast.error(`Maximum ${MAX_GALLERY_ITEMS} gallery items`)
        return
      }
      await startVideoUpload(Array.from(files).slice(0, remaining))
    },
    [startVideoUpload, value.length],
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

  const atLimit = value.length >= MAX_GALLERY_ITEMS

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-neutral-500">
        Lifestyle images and videos shown below the product description on the
        store. Large videos are optimized in your browser before upload to
        speed things up.
      </p>

      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((raw, index) => {
            const item = parseGalleryMediaItem(raw)
            if (!item) return null

            return (
              <li
                key={`${raw}-${index}`}
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

                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
                  {item.type === 'video' ? (
                    <>
                      <video
                        src={item.url}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                      <span className="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 py-0.5 text-[10px] font-medium text-white">
                        Video
                      </span>
                    </>
                  ) : (
                    <Image
                      src={item.url}
                      alt={`Gallery ${index + 1}`}
                      fill
                      className="object-contain p-1"
                      unoptimized={isExternalImageUrl(item.url)}
                    />
                  )}
                </div>

                <span className="min-w-0 flex-1 truncate text-xs text-neutral-500">
                  {item.url}
                </span>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-neutral-500 hover:text-red-600"
                  onClick={() => remove(index)}
                  aria-label={`Remove ${item.type}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            )
          })}
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
          <div className="w-full max-w-sm space-y-3">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-neutral-400" />
            <p className="text-sm font-medium text-neutral-700">
              {statusMessage ||
                (uploadPhase === 'optimizing'
                  ? 'Preparing video…'
                  : 'Uploading…')}
            </p>
            <Progress
              value={
                uploadPhase === 'optimizing' && uploadProgress === 0
                  ? 35
                  : uploadProgress
              }
              className="h-2 bg-neutral-200 [&_[data-slot=progress-indicator]]:bg-neutral-900"
            />
            <p className="text-xs text-neutral-500">
              {uploadPhase === 'optimizing'
                ? 'Compressing large videos locally before upload'
                : 'Keep this tab open until the upload finishes'}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-2 text-neutral-400">
              <ImagePlus className="h-5 w-5" />
              <Film className="h-5 w-5" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-white"
                disabled={atLimit}
                onClick={() => imageInputRef.current?.click()}
              >
                Add image
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-white"
                disabled={atLimit}
                onClick={() => videoInputRef.current?.click()}
              >
                <Video className="mr-1.5 h-3.5 w-3.5" />
                Add video
              </Button>
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              {value.length}/{MAX_GALLERY_ITEMS} items · Images up to 8MB ·
              Videos up to 64MB · MP4 recommended
            </p>
          </>
        )}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            void uploadImages(e.target.files)
            e.target.value = ''
          }}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          multiple
          className="sr-only"
          onChange={(e) => {
            void uploadVideos(e.target.files)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
