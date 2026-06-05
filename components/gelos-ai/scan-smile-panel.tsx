'use client'

import Image from 'next/image'
import { Camera, ImagePlus, Loader2, ScanFace, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { SmileReportCard } from '@/components/gelos-ai/smile-report-card'
import { Button } from '@/components/ui/button'
import {
  clearSmileScanSession,
  loadSmileScanSession,
  saveSmileScanSession,
} from '@/lib/gelos-ai/session-storage'
import type { SmileScanReport } from '@/lib/gelos-ai/smile-scan-types'
import { cn } from '@/lib/utils'

const MAX_IMAGE_EDGE = 1024

async function compressImageDataUrl(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(img.width, img.height))
      const width = Math.round(img.width * scale)
      const height = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not process image'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = dataUrl
  })
}

export function ScanSmilePanel() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [preview, setPreview] = useState<string | null>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [report, setReport] = useState<SmileScanReport | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const saved = loadSmileScanSession()
    if (saved) {
      setPreview(saved.preview)
      setReport(saved.report)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveSmileScanSession({ preview, report })
  }, [hydrated, preview, report])

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null
    stream?.getTracks().forEach((track) => track.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraOn(false)
  }

  useEffect(() => () => stopCamera(), [])

  const startCamera = async () => {
    setError(null)
    setReport(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraOn(true)
      setPreview(null)
    } catch {
      setError('Camera access was denied. Upload a photo instead.')
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
      .then(setPreview)
      .catch(() => setPreview(dataUrl))
    stopCamera()
  }

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setReport(null)
    stopCamera()

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') return
      void compressImageDataUrl(reader.result)
        .then(setPreview)
        .catch(() => setPreview(reader.result as string))
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const runScan = async () => {
    if (!preview) return

    setIsScanning(true)
    setError(null)

    try {
      const image = await compressImageDataUrl(preview)
      const res = await fetch('/api/gelos-ai/scan-smile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })
      const data = (await res.json()) as {
        report?: SmileScanReport
        error?: string
      }

      if (!res.ok || !data.report) {
        throw new Error(data.error ?? 'Smile scan failed.')
      }

      setReport(data.report)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Smile scan failed.')
    } finally {
      setIsScanning(false)
    }
  }

  const reset = () => {
    stopCamera()
    setPreview(null)
    setReport(null)
    setError(null)
    clearSmileScanSession()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#84CC16]/20 text-neutral-900">
            <ScanFace className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Scan your smile</h3>
            <p className="text-sm text-muted-foreground">
              Take or upload a clear front-facing photo for AI-powered smile insights.
            </p>
          </div>
        </div>

        <div
          className={cn(
            'relative overflow-hidden rounded-2xl border border-dashed border-neutral-200 bg-neutral-50',
            preview || cameraOn ? 'aspect-[4/5]' : 'flex min-h-[18rem] items-center justify-center',
          )}
        >
          {cameraOn && !preview && (
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
            />
          )}

          {preview && (
            <Image
              src={preview}
              alt="Smile preview"
              fill
              unoptimized
              className="object-cover"
            />
          )}

          {!cameraOn && !preview && (
            <div className="px-6 text-center">
              <Camera className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
              <p className="text-sm text-muted-foreground">
                Use your camera or upload a smile photo to get started.
              </p>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {!cameraOn && !preview && (
            <>
              <Button
                type="button"
                onClick={() => void startCamera()}
                className="rounded-full bg-neutral-950 text-white hover:bg-neutral-800"
              >
                <Camera className="h-4 w-4" />
                Open camera
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                className="rounded-full"
              >
                <Upload className="h-4 w-4" />
                Upload photo
              </Button>
            </>
          )}

          {cameraOn && !preview && (
            <Button
              type="button"
              onClick={capturePhoto}
              className="rounded-full bg-[#84CC16] text-neutral-950 hover:bg-[#73b512]"
            >
              <ImagePlus className="h-4 w-4" />
              Capture smile
            </Button>
          )}

          {preview && (
            <>
              <Button
                type="button"
                onClick={() => void runScan()}
                disabled={isScanning}
                className="rounded-full bg-[#84CC16] text-neutral-950 hover:bg-[#73b512]"
              >
                {isScanning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ScanFace className="h-4 w-4" />
                )}
                {isScanning ? 'Analyzing…' : 'Analyze smile'}
              </Button>
              <Button type="button" variant="outline" onClick={reset} className="rounded-full">
                Retake
              </Button>
            </>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={onFileChange}
        />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <p className="mt-4 text-xs text-muted-foreground">
          Visual wellness guide only — not a medical diagnosis. For clinical concerns, book a
          dentist below.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm">
        <h3 className="mb-3 font-semibold text-foreground">Your smile report</h3>
        {report ? (
          <SmileReportCard report={report} />
        ) : (
          <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white px-6 text-center">
            <ScanFace className="mb-3 h-10 w-10 text-neutral-300" />
            <p className="text-sm text-muted-foreground">
              Your personalized smile snapshot, scores, and Gelos product picks will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
