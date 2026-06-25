'use client'

import Image from 'next/image'
import { Camera, ImagePlus, Upload, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import {
  attachStreamToVideo,
  isCameraSupported,
  requestCameraStream,
  stopMediaStream,
} from '@/lib/gelos-ai/camera'
import { compressImageDataUrl } from '@/lib/gelos-ai/compress-image'
import { cn } from '@/lib/utils'

const MAX_PHOTOS = 4

const stackTransforms = [
  'rotate-[-10deg] -translate-x-6',
  'rotate-[-4deg] -translate-x-2',
  'rotate-[4deg] translate-x-2',
  'rotate-[10deg] translate-x-6',
] as const

type SmileQuizPhotoUploadProps = {
  photos: string[]
  onPhotosChange: (photos: string[]) => void
  className?: string
}

export function SmileQuizPhotoUpload({
  photos,
  onPhotosChange,
  className,
}: SmileQuizPhotoUploadProps) {
  const [cameraOn, setCameraOn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = useCallback(() => {
    stopMediaStream(streamRef.current)
    streamRef.current = null
    setCameraOn(false)
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  const addPhoto = useCallback(
    (dataUrl: string) => {
      onPhotosChange([...photos, dataUrl].slice(-MAX_PHOTOS))
    },
    [onPhotosChange, photos],
  )

  const startCamera = async () => {
    setError(null)
    stopCamera()

    if (!isCameraSupported()) {
      setError('Camera needs HTTPS on mobile. Upload a photo instead.')
      return
    }

    const video = videoRef.current
    if (!video) {
      setError('Could not start camera. Upload a photo instead.')
      return
    }

    try {
      const stream = await requestCameraStream()
      streamRef.current = stream
      flushSync(() => setCameraOn(true))
      await attachStreamToVideo(video, stream)
    } catch (err) {
      stopCamera()
      setError(
        err instanceof Error
          ? err.message
          : 'Could not open camera. Upload a photo instead.',
      )
    }
  }

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
    void compressImageDataUrl(dataUrl)
      .then((compressed) => {
        addPhoto(compressed)
        stopCamera()
      })
      .catch(() => {
        addPhoto(dataUrl)
        stopCamera()
      })
  }

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files?.length) return

    const remaining = MAX_PHOTOS - photos.length
    const selected = Array.from(files).slice(0, Math.max(remaining, 1))

    selected.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        if (typeof result !== 'string') return
        void compressImageDataUrl(result)
          .then(addPhoto)
          .catch(() => addPhoto(result))
      }
      reader.readAsDataURL(file)
    })

    event.target.value = ''
  }

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, photoIndex) => photoIndex !== index))
  }

  const hasPhotos = photos.length > 0

  return (
    <div
      className={cn(
        'relative flex aspect-[4/3] w-full flex-col overflow-hidden rounded-[1.75rem] border-2 bg-white/70 p-5 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.18)] ring-1 ring-white/80 transition-all lg:rounded-[2rem]',
        hasPhotos
          ? 'border-[#E91E8C]/25 shadow-[0_0_0_1px_rgba(233,30,140,0.08),0_18px_40px_-24px_rgba(233,30,140,0.18)]'
          : 'border-dashed border-[#C5DFF0]',
        className,
      )}
    >
      <video
        ref={videoRef}
        className={cn(
          'absolute inset-0 h-full w-full scale-x-[-1] object-cover',
          cameraOn ? 'z-10 opacity-100' : 'pointer-events-none z-0 opacity-0',
        )}
        playsInline
        muted
        autoPlay
      />
      <canvas ref={canvasRef} className="hidden" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
        className="sr-only"
        onChange={onFileChange}
      />

      {cameraOn ? (
        <div className="relative z-20 mt-auto flex flex-wrap gap-2">
          <button
            type="button"
            onClick={capturePhoto}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            <Camera className="size-4" aria-hidden />
            Capture photo
          </button>
          <button
            type="button"
            onClick={stopCamera}
            className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-5 py-2.5 text-sm font-semibold text-neutral-950 backdrop-blur-sm transition-colors hover:bg-white"
          >
            Cancel
          </button>
        </div>
      ) : hasPhotos ? (
        <div className="relative z-10 flex h-full flex-col">
          <div className="flex flex-1 items-center justify-center py-4">
            <div className="relative h-36 w-full max-w-[15rem]">
              {photos.map((photo, index) => (
                <div
                  key={`${photo.slice(0, 32)}-${index}`}
                  className={cn(
                    'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform',
                    stackTransforms[index] ?? stackTransforms[3],
                  )}
                  style={{ zIndex: index + 1 }}
                >
                  <div className="group relative size-24 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-[0_12px_28px_-14px_rgba(15,23,42,0.35)] sm:size-28">
                    <Image
                      src={photo}
                      alt={`Uploaded smile photo ${index + 1}`}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="112px"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-neutral-950/75 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label={`Remove photo ${index + 1}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {photos.length < MAX_PHOTOS ? (
            <div className="mt-auto flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void startCamera()}
                className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
              >
                <Camera className="size-4" aria-hidden />
                Open camera
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-[#C5DFF0] bg-white px-4 py-2.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-[#F7FBFE]"
              >
                <Upload className="size-4" aria-hidden />
                Upload JPG
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[#DCECF7] text-[#4F7FA3]">
            <ImagePlus className="size-7" aria-hidden />
          </div>
          <p className="mt-4 text-lg font-bold text-neutral-950">Add photos</p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-neutral-600">
            Open your camera or upload a clear smile photo to preview your quiz.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => void startCamera()}
              className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
            >
              <Camera className="size-4" aria-hidden />
              Open camera
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border border-[#C5DFF0] bg-white px-5 py-2.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-[#F7FBFE]"
            >
              <Upload className="size-4" aria-hidden />
              Upload photo
            </button>
          </div>
          <p className="mt-4 text-xs text-neutral-500">JPG, PNG, or WEBP · Up to 4 photos</p>
        </div>
      )}

      {error ? (
        <p className="relative z-20 mt-3 text-xs leading-relaxed text-red-600">{error}</p>
      ) : null}
    </div>
  )
}
