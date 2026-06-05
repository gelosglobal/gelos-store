/** Minimum Laplacian variance to allow smile analysis (tuned for ~256px samples). */
export const MIN_SHARPNESS_FOR_SCAN = 85

/**
 * Estimates image sharpness via Laplacian variance on a downscaled sample.
 * Higher = sharper. Blurry handheld photos typically score below 85.
 */
export async function measureImageSharpness(dataUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        reject(new Error('Could not measure image sharpness'))
        return
      }

      const maxEdge = 256
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
      canvas.width = Math.max(1, Math.round(img.width * scale))
      canvas.height = Math.max(1, Math.round(img.height * scale))
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const gray = new Float32Array(width * height)

      for (let i = 0; i < width * height; i++) {
        const idx = i * 4
        gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
      }

      let sum = 0
      let count = 0

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const center = y * width + x
          const lap =
            -4 * gray[center] +
            gray[center - width] +
            gray[center + width] +
            gray[center - 1] +
            gray[center + 1]
          sum += lap * lap
          count++
        }
      }

      resolve(count > 0 ? sum / count : 0)
    }
    img.onerror = () => reject(new Error('Could not load image for sharpness check'))
    img.src = dataUrl
  })
}

export function sharpnessLabel(score: number): string {
  if (score >= 200) return 'sharp'
  if (score >= MIN_SHARPNESS_FOR_SCAN) return 'acceptable'
  if (score >= 45) return 'soft'
  return 'blurry'
}
