import { getProductHref, getProductSlug } from '@/lib/product-utils'
import type { Product } from '@/lib/types/product'
import {
  BUNDLE_PRODUCT_IDS,
  type BundleSlot,
  bundleProductBlurbs,
  getBundleMatchPercent,
  pairMouthwashSlotForToothpasteSlot,
  resolveBundleProductId,
  resolveBundleSlots,
  slotForLegacyProductId,
} from '@/lib/gelos-ai/bundle-builder'
import type { SmileScanReport } from '@/lib/gelos-ai/smile-scan-types'
import type { SmileTestProductMatch, SmileTestRoutineStep } from '@/lib/gelos-ai/smile-test-types'

const PRODUCT_IDS = BUNDLE_PRODUCT_IDS

export type SmileScanDetailedResults = {
  score: number
  goalLabels: string[]
  focusAreas: string[]
  productMatches: SmileTestProductMatch[]
  morningRoutine: SmileTestRoutineStep[]
  nightRoutine: SmileTestRoutineStep[]
  bundleProductIds: string[]
  bundleDiscountPercent: number
}


function averageScoreOutOf100(scores: SmileScanReport['scores']): number {
  const values = [scores.brightness, scores.freshness, scores.confidence].filter((v) => v > 0)
  if (!values.length) return 0
  const avgOutOf10 = values.reduce((sum, value) => sum + value, 0) / values.length
  return Math.round(avgOutOf10 * 10)
}

export function findProductIdFromPick(
  products: Product[],
  pick: SmileScanReport['products'][number],
): string | undefined {
  const href = pick.href.trim().startsWith('/')
    ? pick.href.trim()
    : `/product/${pick.href.trim().replace(/^\/+/, '')}`
  const slug = href.replace('/product/', '')

  const matched =
    products.find(
      (product) =>
        getProductHref(product) === href ||
        getProductSlug(product) === slug ||
        product.name.toLowerCase() === pick.name.toLowerCase().trim(),
    )?.id ?? undefined

  if (matched) return matched

  const pickName = pick.name.toLowerCase().trim()
  const byPartialName = products.find(
    (product) =>
      product.name.toLowerCase().includes(pickName) ||
      pickName.includes(product.name.toLowerCase()),
  )
  if (byPartialName) return byPartialName.id

  return resolveBundleProductId(pick.href.replace(/^\/product\//, ''), products)
}

function buildGoalLabels(report: SmileScanReport): string[] {
  const goals: string[] = []

  if (report.scores.brightness > 0 && report.scores.brightness < 8) {
    goals.push('Whiter teeth')
  }
  if (report.scores.freshness > 0 && report.scores.freshness < 8) {
    goals.push('Fresh breath')
  }
  if (report.scores.confidence > 0 && report.scores.confidence < 8) {
    goals.push('Smile confidence')
  }
  if (report.scores.brightness >= 8 && report.scores.freshness >= 8 && report.scores.confidence >= 8) {
    goals.push('Maintain results')
  }

  return goals.length > 0 ? goals.slice(0, 3) : ['Better routine']
}

function buildFocusAreas(report: SmileScanReport): string[] {
  const areas = new Set<string>()

  if (report.scores.brightness > 0 && report.scores.brightness < 7) {
    areas.add('Enhance brightness & reduce stains')
  }
  if (report.scores.freshness > 0 && report.scores.freshness < 7) {
    areas.add('Maintain fresh breath')
  }
  if (report.scores.confidence > 0 && report.scores.confidence < 7) {
    areas.add('Boost smile confidence')
  }

  for (const tip of report.tips.slice(0, 2)) {
    if (tip.length > 12) areas.add(tip)
  }

  if (!areas.size) {
    areas.add('Keep up your daily oral care')
    areas.add('Protect enamel with gentle products')
  }

  return [...areas].slice(0, 4)
}

function resolveRoutineProductSlots(report: SmileScanReport): {
  morning: BundleSlot[]
  night: BundleSlot[]
  bundle: BundleSlot[]
} {
  const morning: BundleSlot[] = []
  const night: BundleSlot[] = []
  const extras: BundleSlot[] = []

  const toothpaste: BundleSlot = 'toothpaste'
  const brush: BundleSlot =
    report.scores.confidence > 0 && report.scores.confidence < 7
      ? 'electricBrush'
      : 'bambooBrush'

  morning.push(toothpaste, brush, pairMouthwashSlotForToothpasteSlot(toothpaste))
  night.push(toothpaste, brush)

  if (report.scores.freshness > 0 && report.scores.freshness < 8) {
    const scraper: BundleSlot =
      report.scores.freshness < 6 ? 'copperTongueScraper' : 'tongueScraper'
    morning.push(scraper)
    night.push(scraper)
  }

  if (report.scores.brightness > 0 && report.scores.brightness < 8) {
    morning.push('whiteningStrips')
    night.push('whiteningKit')
    if (report.scores.brightness < 6) {
      extras.push('ledWhitening')
    }
  }

  const morningSlots = [...new Set(morning)]
  const nightSlots = [...new Set(night)]

  return {
    morning: morningSlots,
    night: nightSlots,
    bundle: [...new Set([...extras, ...morningSlots, ...nightSlots])],
  }
}

const morningDurations: Record<string, string> = {
  [PRODUCT_IDS.toothpaste]: '2 min',
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
  [PRODUCT_IDS.electricBrush]: '2 min',
  [PRODUCT_IDS.bambooBrush]: '2 min',
  [PRODUCT_IDS.tongueScraper]: '30 sec',
  [PRODUCT_IDS.copperTongueScraper]: '30 sec',
  [PRODUCT_IDS.whiteningKit]: '10 min',
  [PRODUCT_IDS.whiteningStrips]: '3× per week',
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

function buildProductMatches(
  report: SmileScanReport,
  products: Product[],
  bundleSlots: BundleSlot[],
): SmileTestProductMatch[] {
  const matches: SmileTestProductMatch[] = []
  const used = new Set<string>()

  for (const [index, pick] of report.products.entries()) {
    const productId = findProductIdFromPick(products, pick)
    if (!productId || used.has(productId)) continue
    used.add(productId)
    const legacySlot = slotForLegacyProductId(productId)
    matches.push({
      productId,
      matchPercent: getBundleMatchPercent(productId, index, true, products),
      description:
        pick.reason ||
        (legacySlot ? bundleProductBlurbs[PRODUCT_IDS[legacySlot]] : undefined) ||
        'Recommended from your smile scan.',
    })
  }

  const resolvedBundle = resolveBundleSlots(bundleSlots, products)
  for (const [index, productId] of resolvedBundle.entries()) {
    if (used.has(productId) || matches.length >= 5) continue
    used.add(productId)
    const slot = bundleSlots.find(
      (candidate) => resolveBundleSlots([candidate], products)[0] === productId,
    )
    matches.push({
      productId,
      matchPercent: getBundleMatchPercent(productId, matches.length, index < 3, products),
      description:
        (slot ? bundleProductBlurbs[PRODUCT_IDS[slot]] : undefined) ??
        'Matched to your scan scores and focus areas.',
    })
  }

  return matches.slice(0, 5)
}

export function buildSmileScanDetailedResults(
  report: SmileScanReport,
  products: Product[],
): SmileScanDetailedResults {
  const { morning, night, bundle } = resolveRoutineProductSlots(report)
  const bundleProductIds = resolveBundleSlots(bundle, products)

  return {
    score: averageScoreOutOf100(report.scores),
    goalLabels: buildGoalLabels(report),
    focusAreas: buildFocusAreas(report),
    productMatches: buildProductMatches(report, products, bundle),
    morningRoutine: toRoutineSteps(morning, products, morningDurations),
    nightRoutine: toRoutineSteps(night, products, nightDurations),
    bundleProductIds,
    bundleDiscountPercent: 20,
  }
}
