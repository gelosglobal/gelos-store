import type { Product } from '@/lib/types/product'
import {
  BUNDLE_PRODUCT_IDS,
  type BundleSlot,
  bundleProductBlurbs,
  getBundleMatchPercent,
  getDefaultBundleBudget,
  pairMouthwashSlotForToothpasteSlot,
  pickBundleProductsForBudget,
  resolveBundleSlots,
} from '@/lib/gelos-ai/bundle-builder'
import type {
  SmileTestAnswers,
  SmileTestProductMatch,
  SmileTestResults,
  SmileTestRoutineStep,
} from '@/lib/gelos-ai/smile-test-types'

export {
  getDefaultBundleBudget,
  pickBundleProductsForBudget,
} from '@/lib/gelos-ai/bundle-builder'

const PRODUCT_IDS = BUNDLE_PRODUCT_IDS

function pickToothpasteSlot(answers: SmileTestAnswers): BundleSlot {
  if (answers.goals.includes('kids-care')) return 'strawberryToothpaste'
  if (answers.concerns.includes('sensitivity')) return 'coconutToothpaste'
  return 'toothpaste'
}

function pickBrushSlot(answers: SmileTestAnswers): BundleSlot {
  if (
    answers.goals.includes('better-routine') ||
    answers.goals.includes('healthier-gums') ||
    answers.concerns.includes('plaque')
  ) {
    return 'electricBrush'
  }
  return 'bambooBrush'
}

function buildFocusAreas(answers: SmileTestAnswers): string[] {
  const areas = new Set<string>()

  if (answers.goals.includes('whiter-teeth') || answers.concerns.includes('staining')) {
    areas.add('Remove surface stains')
  }
  if (
    answers.goals.includes('healthier-gums') ||
    answers.concerns.includes('bleeding-gums')
  ) {
    areas.add('Support gum health')
  }
  if (answers.goals.includes('fresh-breath') || answers.concerns.includes('bad-breath')) {
    areas.add('Maintain fresh breath')
  }
  if (answers.goals.includes('prevent-problems') || answers.concerns.includes('plaque')) {
    areas.add('Reduce plaque buildup')
  }
  if (answers.concerns.includes('sensitivity')) {
    areas.add('Gentle enamel care')
  }
  if (answers.goals.includes('better-routine')) {
    areas.add('Build a consistent daily routine')
  }
  if (answers.goals.includes('kids-care')) {
    areas.add('Kid-friendly daily habits')
  }

  if (!areas.size) {
    areas.add('Maintain daily oral wellness')
    areas.add('Keep breath fresh')
  }

  return [...areas].slice(0, 4)
}

function computeScore(answers: SmileTestAnswers): number {
  let score = 74

  if (answers.routine.includes('brush-twice') || answers.routine.includes('brush-thrice')) {
    score += 8
  } else if (answers.routine.includes('brush-once')) {
    score -= 6
  }

  if (answers.routine.includes('floss-daily')) score += 6
  if (answers.routine.includes('floss-sometimes')) score += 3
  if (answers.routine.includes('floss-rarely')) score -= 4

  if (answers.routine.includes('rinse-daily')) score += 4
  if (answers.routine.includes('rinse-sometimes')) score += 2

  if (answers.concerns.includes('no-major-concerns')) score += 5
  if (answers.concerns.includes('bleeding-gums')) score -= 5
  if (answers.concerns.includes('plaque')) score -= 3

  if (answers.lifestyle.includes('coffee-tea')) score -= 3
  if (answers.lifestyle.includes('smoking')) score -= 8
  if (answers.lifestyle.includes('sugary-drinks')) score -= 4
  if (answers.lifestyle.includes('active-lifestyle')) score += 2

  if (answers.goals.includes('better-routine')) score += 2

  return Math.min(98, Math.max(62, score))
}

function resolveRoutineProducts(answers: SmileTestAnswers): {
  morning: BundleSlot[]
  night: BundleSlot[]
  bundle: BundleSlot[]
} {
  const morning: BundleSlot[] = []
  const night: BundleSlot[] = []
  const extras: BundleSlot[] = []

  const toothpaste = pickToothpasteSlot(answers)
  const brush = pickBrushSlot(answers)
  const mouthwash = pairMouthwashSlotForToothpasteSlot(toothpaste)

  morning.push(toothpaste, brush, mouthwash)
  night.push(toothpaste, brush)

  const wantsFreshBreath =
    answers.goals.includes('fresh-breath') || answers.concerns.includes('bad-breath')
  const wantsWhitening =
    answers.goals.includes('whiter-teeth') || answers.concerns.includes('staining')
  const stainProne =
    answers.lifestyle.includes('coffee-tea') ||
    answers.lifestyle.includes('smoking') ||
    answers.lifestyle.includes('sugary-drinks')

  if (wantsFreshBreath) {
    const scraper = answers.goals.includes('better-routine')
      ? 'copperTongueScraper'
      : 'tongueScraper'
    morning.push(scraper)
    night.push(scraper)
  }

  if (wantsWhitening) {
    morning.push('whiteningStrips')
    night.push('whiteningKit')
  } else if (answers.goals.includes('prevent-problems')) {
    night.push('whiteningStrips')
  }

  if (wantsWhitening && stainProne) {
    extras.push('ledWhitening')
  }

  const morningSlots = [...new Set(morning)]
  const nightSlots = [...new Set(night)]
  const bundleSlots = [...new Set([...extras, ...morningSlots, ...nightSlots])]

  return {
    morning: morningSlots,
    night: nightSlots,
    bundle: bundleSlots,
  }
}

function toRoutineSteps(
  slots: BundleSlot[],
  products: Product[],
  durations: Record<string, string>,
): SmileTestRoutineStep[] {
  return slots
    .map((slot) => {
      const productId = resolveBundleSlots([slot], products)[0]
      if (!productId) return null

      const product = products.find((item) => item.id === productId)
      if (!product) return null

      return {
        productId,
        label: product.name,
        duration: durations[PRODUCT_IDS[slot]] ?? 'Daily',
      }
    })
    .filter((step): step is SmileTestRoutineStep => Boolean(step))
}

const morningDurations: Record<string, string> = {
  [PRODUCT_IDS.toothpaste]: '2 min',
  [PRODUCT_IDS.coconutToothpaste]: '2 min',
  [PRODUCT_IDS.strawberryToothpaste]: '2 min',
  [PRODUCT_IDS.electricBrush]: '2 min',
  [PRODUCT_IDS.bambooBrush]: '2 min',
  [PRODUCT_IDS.mouthwashWatermelon]: '30 sec',
  [PRODUCT_IDS.mouthwashStrawberry]: '30 sec',
  [PRODUCT_IDS.mouthwashGrape]: '30 sec',
  [PRODUCT_IDS.tongueScraper]: '30 sec',
  [PRODUCT_IDS.copperTongueScraper]: '30 sec',
  [PRODUCT_IDS.whiteningStrips]: '3× per week',
}

const nightDurations: Record<string, string> = {
  [PRODUCT_IDS.toothpaste]: '2 min',
  [PRODUCT_IDS.coconutToothpaste]: '2 min',
  [PRODUCT_IDS.strawberryToothpaste]: '2 min',
  [PRODUCT_IDS.electricBrush]: '2 min',
  [PRODUCT_IDS.bambooBrush]: '2 min',
  [PRODUCT_IDS.tongueScraper]: '30 sec',
  [PRODUCT_IDS.copperTongueScraper]: '30 sec',
  [PRODUCT_IDS.whiteningKit]: '10 min',
  [PRODUCT_IDS.whiteningStrips]: '3× per week',
}

function isGoalMatchForSlot(slot: BundleSlot, answers: SmileTestAnswers): boolean {
  const whiteningSlots: BundleSlot[] = ['whiteningKit', 'whiteningStrips', 'ledWhitening']
  const freshBreathSlots: BundleSlot[] = [
    'tongueScraper',
    'copperTongueScraper',
    'mouthwashWatermelon',
    'mouthwashStrawberry',
    'mouthwashGrape',
  ]
  const gumCareSlots: BundleSlot[] = ['electricBrush', 'bambooBrush']

  if (
    (answers.goals.includes('whiter-teeth') || answers.concerns.includes('staining')) &&
    whiteningSlots.includes(slot)
  ) {
    return true
  }
  if (
    (answers.goals.includes('fresh-breath') || answers.concerns.includes('bad-breath')) &&
    freshBreathSlots.includes(slot)
  ) {
    return true
  }
  if (
    (answers.goals.includes('healthier-gums') || answers.concerns.includes('bleeding-gums')) &&
    gumCareSlots.includes(slot)
  ) {
    return true
  }
  return slot === pickToothpasteSlot(answers) || slot === pickBrushSlot(answers)
}

function buildProductMatches(
  answers: SmileTestAnswers,
  bundleSlots: BundleSlot[],
  products: Product[],
): SmileTestProductMatch[] {
  const resolvedBundle = resolveBundleSlots(bundleSlots, products)

  return resolvedBundle.slice(0, 5).map((productId, index) => {
    const slot = bundleSlots.find(
      (candidate) => resolveBundleSlots([candidate], products)[0] === productId,
    )

    return {
      productId,
      matchPercent: getBundleMatchPercent(
        productId,
        index,
        slot ? isGoalMatchForSlot(slot, answers) : false,
        products,
      ),
      description:
        (slot ? bundleProductBlurbs[PRODUCT_IDS[slot]] : undefined) ??
        (answers.goals.includes('fresh-breath')
          ? 'Supports fresher breath throughout the day.'
          : 'Matched to your smile test answers.'),
    }
  })
}

export function buildSmileTestResults(
  answers: SmileTestAnswers,
  products: Product[],
): SmileTestResults {
  const { morning, night, bundle } = resolveRoutineProducts(answers)
  const bundleProductIds = resolveBundleSlots(bundle, products)

  return {
    score: computeScore(answers),
    goals: answers.goals,
    focusAreas: buildFocusAreas(answers),
    morningRoutine: toRoutineSteps(morning, products, morningDurations),
    nightRoutine: toRoutineSteps(night, products, nightDurations),
    bundleProductIds,
    bundleDiscountPercent: 20,
    productMatches: buildProductMatches(answers, bundle, products),
  }
}
