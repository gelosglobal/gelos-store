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
  /** Optional 3-step routine strip */
  usageSteps?: ProductUsageStep[]
  usageStepsTitle?: string
  usageStepsIntro?: string
}

const usageStepsDefaultsByCategory: Record<
  string,
  { title: string; intro: string }
> = {
  Toothpaste: {
    title: 'How to use your toothpaste',
    intro:
      'Follow this quick three-step routine for a fresh, flavour-forward clean.',
  },
  'Tongue Scraper': {
    title: 'How to use your tongue scraper',
    intro:
      'Add this 30-second step before brushing for a cleaner tongue and fresher breath.',
  },
  Toothbrushes: {
    title: 'How to use your toothbrush',
    intro: 'Get the most from your brush with this simple daily routine.',
  },
  Whitening: {
    title: 'How to use your whitening treatment',
    intro: 'Follow these steps for a brighter, more confident smile.',
  },
  Mouthwash: {
    title: 'How to use your mouthwash',
    intro: 'A quick rinse routine to freshen breath and complete your smile care.',
  },
  Wellness: {
    title: 'How to use',
    intro: 'Follow these simple steps for best results.',
  },
  'Water Flossers': {
    title: 'How to use your water flosser',
    intro: 'Follow these steps for a deeper clean between teeth and along the gumline.',
  },
  Accessories: {
    title: 'How to use',
    intro: 'Follow these simple steps for best results.',
  },
  Tools: {
    title: 'How to use',
    intro: 'Follow these simple steps for best results.',
  },
}

export function getUsageStepsSectionMeta(
  category: string,
  content: ProductPdpContent,
): { title: string; intro: string } | null {
  if (!content.usageSteps?.length) return null

  if (content.usageStepsTitle && content.usageStepsIntro) {
    return {
      title: content.usageStepsTitle,
      intro: content.usageStepsIntro,
    }
  }

  return (
    usageStepsDefaultsByCategory[category] ?? {
      title: 'How to use',
      intro: 'Follow these simple steps for best results.',
    }
  )
}
