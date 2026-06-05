const CAMERA_CONSTRAINTS: MediaStreamConstraints[] = [
  {
    video: {
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  },
  {
    video: { facingMode: 'user' },
    audio: false,
  },
  {
    video: true,
    audio: false,
  },
]

export function isCameraSupported(): boolean {
  if (typeof window === 'undefined') return false
  if (!window.isSecureContext) return false
  return Boolean(navigator.mediaDevices?.getUserMedia)
}

export function cameraUnavailableReason(): string | null {
  if (typeof window === 'undefined') return 'Camera is only available in the browser.'
  if (!window.isSecureContext) {
    return 'Camera requires a secure connection (HTTPS). Upload a photo instead.'
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return 'Camera is not supported in this browser. Upload a photo instead.'
  }
  return null
}

export async function requestCameraStream(): Promise<MediaStream> {
  const unavailable = cameraUnavailableReason()
  if (unavailable) {
    throw new Error(unavailable)
  }

  let lastError: unknown = new Error('Could not open camera')

  for (const constraints of CAMERA_CONSTRAINTS) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints)
    } catch (error) {
      lastError = error
    }
  }

  if (lastError instanceof DOMException) {
    if (lastError.name === 'NotAllowedError' || lastError.name === 'PermissionDeniedError') {
      throw new Error('Camera access was denied. Allow camera permission or upload a photo.')
    }
    if (lastError.name === 'NotFoundError' || lastError.name === 'DevicesNotFoundError') {
      throw new Error('No camera found on this device. Upload a photo instead.')
    }
    if (lastError.name === 'NotReadableError' || lastError.name === 'TrackStartError') {
      throw new Error('Camera is in use by another app. Close it and try again.')
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Could not open camera. Upload a photo instead.')
}

export async function attachStreamToVideo(
  video: HTMLVideoElement,
  stream: MediaStream,
): Promise<void> {
  video.srcObject = stream
  video.muted = true
  video.playsInline = true
  video.autoplay = true
  video.setAttribute('playsinline', 'true')
  video.setAttribute('webkit-playsinline', 'true')

  if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        cleanup()
        reject(new Error('Camera preview timed out'))
      }, 8000)

      const onReady = () => {
        cleanup()
        resolve()
      }

      const onError = () => {
        cleanup()
        reject(new Error('Could not load camera preview'))
      }

      const cleanup = () => {
        window.clearTimeout(timeout)
        video.removeEventListener('loadedmetadata', onReady)
        video.removeEventListener('error', onError)
      }

      video.addEventListener('loadedmetadata', onReady, { once: true })
      video.addEventListener('error', onError, { once: true })
    })
  }

  await video.play()
}

export function stopMediaStream(
  stream: MediaStream | null | undefined,
  video?: HTMLVideoElement | null,
): void {
  stream?.getTracks().forEach((track) => track.stop())
  if (video) {
    video.pause()
    video.srcObject = null
  }
}
