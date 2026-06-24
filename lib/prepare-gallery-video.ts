const COMPRESS_ABOVE_BYTES = 10 * 1024 * 1024
const MAX_WIDTH = 1280
const VIDEO_BITRATE = 2_500_000

export type PrepareGalleryVideoProgress = {
  phase: 'optimizing'
  percent: number | null
  message: string
}

export type PrepareGalleryVideoResult = {
  file: File
  wasCompressed: boolean
  originalSize: number
  finalSize: number
}

function pickRecorderMimeType(): string | null {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ]

  return (
    candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null
  )
}

function isBrowserCompressionSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    pickRecorderMimeType() !== null
  )
}

function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

async function loadVideoMetadata(
  file: File,
): Promise<{ video: HTMLVideoElement; objectUrl: string }> {
  const objectUrl = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.preload = 'metadata'
  video.playsInline = true
  video.muted = true
  video.src = objectUrl

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve()
    video.onerror = () => reject(new Error('Could not read video file'))
  })

  return { video, objectUrl }
}

async function compressVideoFile(
  file: File,
  onProgress?: (progress: PrepareGalleryVideoProgress) => void,
): Promise<File> {
  const mimeType = pickRecorderMimeType()
  if (!mimeType) {
    throw new Error('Video compression is not supported in this browser')
  }

  const { video, objectUrl } = await loadVideoMetadata(file)

  try {
    const scale = Math.min(1, MAX_WIDTH / video.videoWidth)
    const width = Math.max(2, Math.round(video.videoWidth * scale))
    const height = Math.max(2, Math.round(video.videoHeight * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not prepare video canvas')

    const stream = canvas.captureStream(30)
    const chunks: Blob[] = []

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: VIDEO_BITRATE,
    })

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }

    const recorded = new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }))
      recorder.onerror = () => reject(new Error('Video compression failed'))
    })

    let drawing = true
    const drawFrame = () => {
      if (!drawing) return
      ctx.drawImage(video, 0, 0, width, height)
      if (video.duration > 0) {
        onProgress?.({
          phase: 'optimizing',
          percent: Math.min(
            99,
            Math.round((video.currentTime / video.duration) * 100),
          ),
          message: 'Optimizing video for faster upload…',
        })
      }
      if (!video.paused && !video.ended) {
        requestAnimationFrame(drawFrame)
      }
    }

    recorder.start(250)
    video.currentTime = 0
    await video.play()
    requestAnimationFrame(drawFrame)

    await new Promise<void>((resolve) => {
      video.onended = () => {
        drawing = false
        resolve()
      }
    })

    recorder.stop()
    const blob = await recorded

    const extension = mimeType.includes('mp4') ? 'mp4' : 'webm'
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'gallery-video'

    return new File([blob], `${baseName}-optimized.${extension}`, {
      type: mimeType,
      lastModified: Date.now(),
    })
  } finally {
    video.pause()
    URL.revokeObjectURL(objectUrl)
  }
}

/** Shrink large gallery videos before upload to reduce transfer time. */
export async function prepareGalleryVideo(
  file: File,
  onProgress?: (progress: PrepareGalleryVideoProgress) => void,
): Promise<PrepareGalleryVideoResult> {
  const originalSize = file.size

  if (file.size < COMPRESS_ABOVE_BYTES || !isBrowserCompressionSupported()) {
    return {
      file,
      wasCompressed: false,
      originalSize,
      finalSize: file.size,
    }
  }

  onProgress?.({
    phase: 'optimizing',
    percent: null,
    message: `Preparing ${formatMegabytes(file.size)} video…`,
  })

  try {
    const compressed = await compressVideoFile(file, onProgress)

    if (compressed.size < file.size * 0.85) {
      onProgress?.({
        phase: 'optimizing',
        percent: 100,
        message: `Optimized ${formatMegabytes(file.size)} → ${formatMegabytes(compressed.size)}`,
      })

      return {
        file: compressed,
        wasCompressed: true,
        originalSize,
        finalSize: compressed.size,
      }
    }
  } catch {
    // Fall back to the original upload if browser compression fails.
  }

  return {
    file,
    wasCompressed: false,
    originalSize,
    finalSize: file.size,
  }
}
