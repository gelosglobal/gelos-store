'use client'

import Image from 'next/image'
import { AlertTriangle, Camera, Gift, ImagePlus, Loader2, ScanFace, Upload } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { SmileReportCard } from '@/components/gelos-ai/smile-report-card'
import { MysteryRewardRevealDialog } from '@/components/gelos-ai/mystery-reward-reveal-dialog'
import { Button } from '@/components/ui/button'
import { useProducts } from '@/components/products-provider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  clearSmileScanSession,
  getOrCreateGelosAiSessionId,
  loadSmileScanSession,
  saveSmileScanSession,
} from '@/lib/gelos-ai/session-storage'
import {
  attachStreamToVideo,
  isCameraSupported,
  requestCameraStream,
  stopMediaStream,
} from '@/lib/gelos-ai/camera'
import { compressImageDataUrl } from '@/lib/gelos-ai/compress-image'
import {
  MIN_SHARPNESS_FOR_SCAN,
  measureImageSharpness,
  sharpnessLabel,
} from '@/lib/gelos-ai/image-sharpness'
import type { SmileScanReport } from '@/lib/gelos-ai/smile-scan-types'
import { buildMysteryRewardBoard, type MysteryRewardBoard } from '@/lib/gelos-ai/mystery-reward'
import { cn } from '@/lib/utils'

const REWARD_REVEAL_DELAY_MS = 3500

export function ScanSmilePanel() {
  const { products } = useProducts()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const rewardRevealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [preview, setPreview] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [cameraOn, setCameraOn] = useState(false)
  const [report, setReport] = useState<SmileScanReport | null>(null)
  const [scanId, setScanId] = useState<string | undefined>()
  const [shareable, setShareable] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [sharpnessScore, setSharpnessScore] = useState<number | null>(null)
  const [isCheckingQuality, setIsCheckingQuality] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [mysteryRewardBoard, setMysteryRewardBoard] = useState<MysteryRewardBoard | null>(
    null,
  )
  const [mysteryRewardOpen, setMysteryRewardOpen] = useState(false)
  const [mysteryRewardShown, setMysteryRewardShown] = useState(false)
  const [rewardRevealPending, setRewardRevealPending] = useState(false)

  const clearRewardRevealTimeout = useCallback(() => {
    if (rewardRevealTimeoutRef.current) {
      clearTimeout(rewardRevealTimeoutRef.current)
      rewardRevealTimeoutRef.current = null
    }
  }, [])

  const scheduleRewardReveal = useCallback(() => {
    clearRewardRevealTimeout()
    setRewardRevealPending(true)
    rewardRevealTimeoutRef.current = setTimeout(() => {
      setMysteryRewardOpen(true)
      setRewardRevealPending(false)
      rewardRevealTimeoutRef.current = null
    }, REWARD_REVEAL_DELAY_MS)
  }, [clearRewardRevealTimeout])

  useEffect(() => () => clearRewardRevealTimeout(), [clearRewardRevealTimeout])

  useEffect(() => {
    const saved = loadSmileScanSession()
    if (saved) {
      setPreview(saved.preview)
      setReport(saved.report)
      setName(saved.name)
      setScanId(saved.scanId)
      setShareable(saved.shareable === true)
      setMysteryRewardShown(saved.mysteryRewardShown === true)
      setMysteryRewardBoard(saved.mysteryRewardBoard ?? null)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveSmileScanSession({
      preview,
      report,
      name,
      scanId,
      shareable,
      mysteryRewardShown,
      mysteryRewardBoard,
    })
  }, [
    hydrated,
    preview,
    report,
    name,
    scanId,
    shareable,
    mysteryRewardShown,
    mysteryRewardBoard,
  ])

  useEffect(() => {
    if (!preview) {
      setSharpnessScore(null)
      return
    }

    let cancelled = false
    setIsCheckingQuality(true)

    void measureImageSharpness(preview)
      .then((score) => {
        if (!cancelled) setSharpnessScore(score)
      })
      .catch(() => {
        if (!cancelled) setSharpnessScore(null)
      })
      .finally(() => {
        if (!cancelled) setIsCheckingQuality(false)
      })

    return () => {
      cancelled = true
    }
  }, [preview])

  const stopCamera = () => {
    stopMediaStream(streamRef.current, videoRef.current)
    streamRef.current = null
    setCameraOn(false)
  }

  useEffect(() => () => stopCamera(), [])

  const startCamera = async () => {
    setError(null)
    setReport(null)
    setScanId(undefined)
    setShareable(false)
    setMysteryRewardBoard(null)
    setMysteryRewardOpen(false)
    setRewardRevealPending(false)
    clearRewardRevealTimeout()
    stopCamera()

    if (!isCameraSupported()) {
      setError(
        typeof window !== 'undefined' && !window.isSecureContext
          ? 'Camera requires HTTPS on mobile. Upload a photo instead.'
          : 'Camera is not supported in this browser. Upload a photo instead.',
      )
      return
    }

    const video = videoRef.current
    if (!video) {
      setError('Could not start camera preview. Upload a photo instead.')
      return
    }

    try {
      const stream = await requestCameraStream()
      streamRef.current = stream
      flushSync(() => {
        setPreview(null)
        setCameraOn(true)
      })
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
      .then(setPreview)
      .catch(() => setPreview(dataUrl))
    stopCamera()
  }

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setReport(null)
    setScanId(undefined)
    setShareable(false)
    setMysteryRewardBoard(null)
    setMysteryRewardOpen(false)
    setRewardRevealPending(false)
    clearRewardRevealTimeout()
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
    if (!preview || name.trim().length < 2) return

    setIsScanning(true)
    setError(null)
    setReport(null)

    try {
      const image = await compressImageDataUrl(preview)
      const res = await fetch('/api/gelos-ai/scan-smile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          name: name.trim(),
          sessionId: getOrCreateGelosAiSessionId(),
          sharpnessScore: sharpnessScore ?? undefined,
        }),
      })
      const data = (await res.json()) as {
        report?: SmileScanReport
        scanId?: string
        persisted?: boolean
        error?: string
      }

      if (!res.ok || !data.report) {
        throw new Error(data.error ?? 'Smile scan failed.')
      }

      setReport(data.report)
      setScanId(data.persisted ? data.scanId : undefined)
      setShareable(data.persisted === true && Boolean(data.scanId))

      const board = buildMysteryRewardBoard(data.report, products)
      if (board) {
        setMysteryRewardBoard(board)
        setMysteryRewardShown(true)
        scheduleRewardReveal()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Smile scan failed.')
    } finally {
      setIsScanning(false)
    }
  }

  const reset = () => {
    stopCamera()
    setPreview(null)
    setName('')
    setReport(null)
    setScanId(undefined)
    setShareable(false)
    setMysteryRewardBoard(null)
    setMysteryRewardOpen(false)
    setRewardRevealPending(false)
    clearRewardRevealTimeout()
    setMysteryRewardShown(false)
    setError(null)
    clearSmileScanSession()
  }

  const photoTooBlurry =
    sharpnessScore !== null && sharpnessScore < MIN_SHARPNESS_FOR_SCAN
  const canAnalyze =
    preview &&
    name.trim().length >= 2 &&
    !isScanning &&
    !isCheckingQuality &&
    !photoTooBlurry

  return (
    <>
      <MysteryRewardRevealDialog
        open={mysteryRewardOpen}
        onOpenChange={setMysteryRewardOpen}
        board={mysteryRewardBoard}
        report={report}
        customerName={name.trim()}
        scanId={shareable ? scanId : undefined}
      />

      <div className={cn('grid gap-6', !report && 'lg:grid-cols-2')}>
      <div
        className={cn(
          'rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm',
          report && 'mx-auto w-full max-w-xl',
        )}
      >
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
            'relative w-full overflow-hidden rounded-2xl border border-dashed border-neutral-200 bg-neutral-950',
            preview || cameraOn
              ? 'aspect-[4/5] min-h-[18rem] sm:min-h-[20rem]'
              : 'flex min-h-[18rem] items-center justify-center bg-neutral-50',
          )}
        >
          <video
            ref={videoRef}
            className={cn(
              'absolute inset-0 h-full w-full scale-x-[-1] object-cover',
              cameraOn && !preview
                ? 'z-10 opacity-100'
                : 'pointer-events-none z-0 opacity-0',
            )}
            playsInline
            muted
            autoPlay
          />

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

        {preview && !report && photoTooBlurry && (
          <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-950">
                  This photo looks too blurry
                </p>
                <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
                  We cannot give an honest smile score from a soft or out-of-focus image.
                  Retake in good light, hold steady, and tap to focus on your teeth before
                  analyzing.
                </p>
              </div>
            </div>
          </div>
        )}

        {preview && !report && !photoTooBlurry && (
          <div className="mt-4 rounded-2xl border border-[#84CC16]/30 bg-[#84CC16]/10 p-4">
            <Label htmlFor="smile-scan-name" className="text-sm font-semibold text-foreground">
              Your name
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Enter your name so we can personalize your smile report before analysis.
              {isCheckingQuality
                ? ' Checking photo quality…'
                : sharpnessScore !== null
                  ? ` Photo quality: ${sharpnessLabel(sharpnessScore)}.`
                  : ''}
            </p>
            <Input
              id="smile-scan-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ama"
              className="mt-3 rounded-xl bg-white"
              disabled={isScanning}
              autoComplete="name"
            />
          </div>
        )}

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
            <>
              <Button
                type="button"
                onClick={capturePhoto}
                className="rounded-full bg-[#84CC16] text-neutral-950 hover:bg-[#73b512]"
              >
                <ImagePlus className="h-4 w-4" />
                Capture smile
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={stopCamera}
                className="rounded-full"
              >
                Cancel
              </Button>
            </>
          )}

          {preview && (
            <>
              <Button
                type="button"
                onClick={() => void runScan()}
                disabled={!canAnalyze}
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

      {!report ? (
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm">
        <h3 className="mb-3 font-semibold text-foreground">Your smile report</h3>
        {rewardRevealPending ? (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-[#84CC16]/30 bg-[#84CC16]/10 px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#84CC16]/20 text-neutral-900">
              <Loader2 className="h-5 w-5 animate-spin" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">
                Preparing your mystery reward…
              </span>
              <span className="text-xs text-muted-foreground">
                Hang tight — your surprise unlocks in a moment.
              </span>
            </span>
          </div>
        ) : null}
        {isScanning ? (
          <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white px-6 text-center">
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-[#84CC16]" />
            <p className="text-sm font-medium text-foreground">
              Creating your report{name.trim() ? `, ${name.trim().split(/\s+/)[0]}` : ''}…
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              This usually takes a few seconds.
            </p>
          </div>
        ) : (
          <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white px-6 text-center">
            <ScanFace className="mb-3 h-10 w-10 text-neutral-300" />
            <p className="text-sm text-muted-foreground">
              {preview
                ? 'Add your name, then tap Analyze smile to see your personalized report.'
                : 'Your personalized smile snapshot, scores, and Gelos product picks will appear here.'}
            </p>
          </div>
        )}
      </div>
      ) : null}
    </div>

    {report && !isScanning ? (
      <div className="mt-6">
        {mysteryRewardBoard && !mysteryRewardOpen && !rewardRevealPending ? (
          <button
            type="button"
            onClick={() => setMysteryRewardOpen(true)}
            className="mb-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-[#84CC16]/30 bg-[#84CC16]/10 px-4 py-3 text-left transition-colors hover:bg-[#84CC16]/15"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#84CC16]/20 text-neutral-900">
                <Gift className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  Mystery reward waiting
                </span>
                <span className="text-xs text-muted-foreground">
                  Tap to reveal your Gelos product reward
                </span>
              </span>
            </span>
            <span className="text-sm font-semibold text-[#4d7c0f]">Reveal</span>
          </button>
        ) : null}
        <SmileReportCard
          report={report}
          customerName={name.trim()}
          scanId={shareable ? scanId : undefined}
        />
      </div>
    ) : null}
    </>
  )
}
