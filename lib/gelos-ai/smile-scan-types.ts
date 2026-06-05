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
