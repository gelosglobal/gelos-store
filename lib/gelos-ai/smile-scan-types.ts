export type SmileScanProductPick = {
  name: string
  href: string
  reason: string
}

export type SmileScanReport = {
  snapshot: string
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
