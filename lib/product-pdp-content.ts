export type ProductHighlight = {
  label: string
  emoji: string
}

export type ProductAccordionItem = {
  id: string
  title: string
  content: string
}

export type ProductUsageStep = {
  title: string
  body: string
}

export type ProductPdpContent = {
  galleryImages: string[]
  imageBadge?: string
  headline: string
  intro: string
  bullets: string[]
  highlights: ProductHighlight[]
  detailsAccordion: ProductAccordionItem[]
  faq: ProductAccordionItem[]
  /** Optional 3-step routine strip (tongue scraper PDP) */
  usageSteps?: ProductUsageStep[]
}
