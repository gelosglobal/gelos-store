export type SmileScanProductPick = {
  name: string
  href: string
  reason: string
}

export type SmileScanImageQuality = {
  analyzable: boolean
  clarity: number
  issues: string[]
}

export type SmileScanReport = {
  snapshot: string
  imageQuality?: SmileScanImageQuality
  /** True when the smile in the photo appears to be a child’s (approx under 12). */
  subjectIsChild?: boolean
  scores: {
    brightness: number
    freshness: number
    confidence: number
  }
  tips: string[]
  products: SmileScanProductPick[]
  dentistNote: string
  disclaimer: string
}
