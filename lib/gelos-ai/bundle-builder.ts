import type { Product } from '@/lib/types/product'

export type BundleFrequency = 'everyday' | 'few-times' | 'weekly'

export type BundleProductTier =
  | 'essential'
  | 'core'
  | 'support'
  | 'treatment'
  | 'premium'

export const BUNDLE_PRODUCT_IDS = {
  toothpaste: '1',
  coconutToothpaste: '13',
  strawberryToothpaste: '15',
  tongueScraper: '2',
  copperTongueScraper: '23',
  whiteningKit: '3',
  whiteningStrips: '7',
  bambooBrush: '8',
  mouthwashWatermelon: '12',
  mouthwashStrawberry: '20',
  mouthwashGrape: '22',
  ledWhitening: '10',
  electricBrush: '24',
} as const

export type BundleSlot = keyof typeof BUNDLE_PRODUCT_IDS

type SlotMatcher = {
  preferredId: string
  category?: string
  nameIncludesAny?: string[]
  excludeNameIncludes?: string[]
  categoryFallback?: boolean
}

const SLOT_MATCHERS: Record<BundleSlot, SlotMatcher> = {
  toothpaste: {
    preferredId: BUNDLE_PRODUCT_IDS.toothpaste,
    category: 'Toothpaste',
    nameIncludesAny: ['watermelon'],
    categoryFallback: true,
  },
  coconutToothpaste: {
    preferredId: BUNDLE_PRODUCT_IDS.coconutToothpaste,
    category: 'Toothpaste',
    nameIncludesAny: ['coconut'],
  },
  strawberryToothpaste: {
    preferredId: BUNDLE_PRODUCT_IDS.strawberryToothpaste,
    category: 'Toothpaste',
    nameIncludesAny: ['strawberry'],
  },
  tongueScraper: {
    preferredId: BUNDLE_PRODUCT_IDS.tongueScraper,
    category: 'Tongue Scraper',
    excludeNameIncludes: ['copper'],
    categoryFallback: true,
  },
  copperTongueScraper: {
    preferredId: BUNDLE_PRODUCT_IDS.copperTongueScraper,
    category: 'Tongue Scraper',
    nameIncludesAny: ['copper'],
  },
  whiteningKit: {
    preferredId: BUNDLE_PRODUCT_IDS.whiteningKit,
    category: 'Whitening',
    nameIncludesAny: ['v34', 'kit', 'shade'],
  },
  whiteningStrips: {
    preferredId: BUNDLE_PRODUCT_IDS.whiteningStrips,
    category: 'Whitening',
    nameIncludesAny: ['strip'],
  },
  bambooBrush: {
    preferredId: BUNDLE_PRODUCT_IDS.bambooBrush,
    category: 'Toothbrushes',
    nameIncludesAny: ['bamboo'],
    excludeNameIncludes: ['kid', 'kids', 'child', 'junior', 'sonic', 'electric'],
  },
  electricBrush: {
    preferredId: BUNDLE_PRODUCT_IDS.electricBrush,
    category: 'Toothbrushes',
    nameIncludesAny: ['sonic', 'electric', '3d'],
    excludeNameIncludes: ['kid', 'kids', 'child', 'junior'],
  },
  mouthwashWatermelon: {
    preferredId: BUNDLE_PRODUCT_IDS.mouthwashWatermelon,
    category: 'Mouthwash',
    nameIncludesAny: ['watermelon'],
    categoryFallback: true,
  },
  mouthwashStrawberry: {
    preferredId: BUNDLE_PRODUCT_IDS.mouthwashStrawberry,
    category: 'Mouthwash',
    nameIncludesAny: ['strawberry'],
  },
  mouthwashGrape: {
    preferredId: BUNDLE_PRODUCT_IDS.mouthwashGrape,
    category: 'Mouthwash',
    nameIncludesAny: ['grape'],
  },
  ledWhitening: {
    preferredId: BUNDLE_PRODUCT_IDS.ledWhitening,
    category: 'Whitening',
    nameIncludesAny: ['led'],
  },
}

function matchesSlot(product: Product, matcher: SlotMatcher): boolean {
  if (matcher.category && product.category !== matcher.category) return false

  const name = product.name.toLowerCase()
  if (matcher.excludeNameIncludes?.some((part) => name.includes(part))) return false
  if (
    matcher.nameIncludesAny?.length &&
    !matcher.nameIncludesAny.some((part) => name.includes(part))
  ) {
    return false
  }

  return true
}

export function resolveBundleSlot(
  slot: BundleSlot,
  products: Product[],
): string | undefined {
  const matcher = SLOT_MATCHERS[slot]
  const preferred = products.find((product) => product.id === matcher.preferredId)
  if (preferred) return preferred.id

  const matched = products.find((product) => matchesSlot(product, matcher))
  if (matched) return matched.id

  if (matcher.categoryFallback && matcher.category) {
    return products.find((product) => product.category === matcher.category)?.id
  }

  return undefined
}

export function slotForLegacyProductId(productId: string): BundleSlot | undefined {
  return (Object.keys(BUNDLE_PRODUCT_IDS) as BundleSlot[]).find(
    (slot) => BUNDLE_PRODUCT_IDS[slot] === productId,
  )
}

export function resolveBundleProductId(
  productId: string,
  products: Product[],
): string | undefined {
  if (products.some((product) => product.id === productId)) return productId

  const slot = slotForLegacyProductId(productId)
  if (!slot) return undefined

  return resolveBundleSlot(slot, products)
}

export function resolveBundleProductIds(
  productIds: string[],
  products: Product[],
): string[] {
  const resolved: string[] = []
  const used = new Set<string>()

  for (const productId of productIds) {
    const catalogId = resolveBundleProductId(productId, products)
    if (!catalogId || used.has(catalogId)) continue
    resolved.push(catalogId)
    used.add(catalogId)
  }

  return sortBundleProductIds(resolved, products)
}

export function resolveBundleSlots(
  slots: BundleSlot[],
  products: Product[],
): string[] {
  const resolved: string[] = []
  const used = new Set<string>()

  for (const slot of slots) {
    const catalogId = resolveBundleSlot(slot, products)
    if (!catalogId || used.has(catalogId)) continue
    resolved.push(catalogId)
    used.add(catalogId)
  }

  return sortBundleProductIds(resolved, products)
}

export function pairMouthwashSlotForToothpasteSlot(
  toothpasteSlot: BundleSlot,
): BundleSlot {
  const pairings: Partial<Record<BundleSlot, BundleSlot>> = {
    toothpaste: 'mouthwashWatermelon',
    coconutToothpaste: 'mouthwashGrape',
    strawberryToothpaste: 'mouthwashStrawberry',
  }

  return pairings[toothpasteSlot] ?? 'mouthwashWatermelon'
}

const TIER_RANK: Record<BundleProductTier, number> = {
  essential: 0,
  core: 1,
  support: 2,
  treatment: 3,
  premium: 4,
}

const PRODUCT_TIERS: Record<string, BundleProductTier> = {
  [BUNDLE_PRODUCT_IDS.toothpaste]: 'essential',
  [BUNDLE_PRODUCT_IDS.coconutToothpaste]: 'essential',
  [BUNDLE_PRODUCT_IDS.strawberryToothpaste]: 'essential',
  [BUNDLE_PRODUCT_IDS.bambooBrush]: 'core',
  [BUNDLE_PRODUCT_IDS.electricBrush]: 'core',
  [BUNDLE_PRODUCT_IDS.mouthwashWatermelon]: 'support',
  [BUNDLE_PRODUCT_IDS.mouthwashStrawberry]: 'support',
  [BUNDLE_PRODUCT_IDS.mouthwashGrape]: 'support',
  [BUNDLE_PRODUCT_IDS.tongueScraper]: 'support',
  [BUNDLE_PRODUCT_IDS.copperTongueScraper]: 'support',
  [BUNDLE_PRODUCT_IDS.whiteningStrips]: 'treatment',
  [BUNDLE_PRODUCT_IDS.whiteningKit]: 'treatment',
  [BUNDLE_PRODUCT_IDS.ledWhitening]: 'premium',
}

const FREQUENCY_SKIP_IDS: Record<BundleFrequency, ReadonlySet<string>> = {
  everyday: new Set(),
  'few-times': new Set([BUNDLE_PRODUCT_IDS.ledWhitening]),
  weekly: new Set([
    BUNDLE_PRODUCT_IDS.ledWhitening,
    BUNDLE_PRODUCT_IDS.whiteningKit,
    BUNDLE_PRODUCT_IDS.whiteningStrips,
  ]),
}

const FREQUENCY_MAX_TIER: Record<BundleFrequency, BundleProductTier> = {
  everyday: 'premium',
  'few-times': 'treatment',
  weekly: 'support',
}

export const bundleProductBlurbs: Record<string, string> = {
  [BUNDLE_PRODUCT_IDS.toothpaste]:
    'Daily fluoride+ clean — our bestseller for whitening and fresh breath.',
  [BUNDLE_PRODUCT_IDS.coconutToothpaste]:
    'Gentle, creamy formula — ideal for sensitive smiles and kids.',
  [BUNDLE_PRODUCT_IDS.strawberryToothpaste]:
    'Kid-friendly flavour with the same fluoride+ protection.',
  [BUNDLE_PRODUCT_IDS.tongueScraper]:
    'Removes odor-causing bacteria for noticeably fresher breath.',
  [BUNDLE_PRODUCT_IDS.copperTongueScraper]:
    'Premium copper scraper for a refined fresh-breath ritual.',
  [BUNDLE_PRODUCT_IDS.whiteningKit]:
    'V34 shade correction for visible brightening at home.',
  [BUNDLE_PRODUCT_IDS.whiteningStrips]:
    'Easy PAP+ strips — great between brush sessions.',
  [BUNDLE_PRODUCT_IDS.bambooBrush]:
    'Eco soft-bristle brush for gentle everyday gum care.',
  [BUNDLE_PRODUCT_IDS.electricBrush]:
    'Sonic deep clean with timer — upgrades your daily routine.',
  [BUNDLE_PRODUCT_IDS.mouthwashWatermelon]:
    'Alcohol-free foaming rinse — pairs with watermelon toothpaste.',
  [BUNDLE_PRODUCT_IDS.mouthwashStrawberry]:
    'Sweet foaming rinse — pairs with fruity toothpaste picks.',
  [BUNDLE_PRODUCT_IDS.mouthwashGrape]:
    'Fun grape bubblegum rinse — great for family routines.',
  [BUNDLE_PRODUCT_IDS.ledWhitening]:
    'LED accelerator for coffee, tea, and stain-prone lifestyles.',
}

export function slotForCatalogProduct(product: Product): BundleSlot | undefined {
  return (Object.keys(SLOT_MATCHERS) as BundleSlot[]).find((slot) =>
    matchesSlot(product, SLOT_MATCHERS[slot]),
  )
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)]
}

function getProductTier(productId: string, products: Product[] = []): BundleProductTier {
  if (PRODUCT_TIERS[productId]) return PRODUCT_TIERS[productId]

  const product = products.find((item) => item.id === productId)
  if (product) {
    const slot = slotForCatalogProduct(product)
    if (slot) return PRODUCT_TIERS[BUNDLE_PRODUCT_IDS[slot]] ?? 'treatment'
  }

  const legacySlot = slotForLegacyProductId(productId)
  if (legacySlot) return PRODUCT_TIERS[BUNDLE_PRODUCT_IDS[legacySlot]] ?? 'treatment'

  return 'treatment'
}

function shouldSkipForFrequency(
  productId: string,
  frequency: BundleFrequency,
  products: Product[],
): boolean {
  const skip = FREQUENCY_SKIP_IDS[frequency]
  if (skip.has(productId)) return true

  const product = products.find((item) => item.id === productId)
  if (!product) return false

  const slot = slotForCatalogProduct(product)
  return slot ? skip.has(BUNDLE_PRODUCT_IDS[slot]) : false
}

export function sortBundleProductIds(
  productIds: string[],
  products: Product[] = [],
): string[] {
  return uniqueIds(productIds).sort((a, b) => {
    const tierDiff = TIER_RANK[getProductTier(a, products)] - TIER_RANK[getProductTier(b, products)]
    if (tierDiff !== 0) return tierDiff
    return a.localeCompare(b)
  })
}

export function filterBundleByFrequency(
  productIds: string[],
  frequency: BundleFrequency,
  products: Product[] = [],
): string[] {
  const maxTierRank = TIER_RANK[FREQUENCY_MAX_TIER[frequency]]

  return sortBundleProductIds(productIds, products).filter((id) => {
    if (shouldSkipForFrequency(id, frequency, products)) return false
    return TIER_RANK[getProductTier(id, products)] <= maxTierRank
  })
}

export function pairMouthwashForToothpaste(toothpasteId: string): string {
  const slot = slotForLegacyProductId(toothpasteId)
  if (slot) {
    return BUNDLE_PRODUCT_IDS[pairMouthwashSlotForToothpasteSlot(slot)]
  }
  return BUNDLE_PRODUCT_IDS.mouthwashWatermelon
}

export function buildPrioritizedBundleIds(
  morning: string[],
  night: string[],
  extras: string[] = [],
): string[] {
  return sortBundleProductIds([...extras, ...morning, ...night])
}

function bundleTotal(
  productIds: string[],
  products: Product[],
  discountPercent: number,
): number {
  const subtotal = productIds.reduce((sum, id) => {
    return sum + (products.find((product) => product.id === id)?.price ?? 0)
  }, 0)
  return subtotal * (1 - discountPercent / 100)
}

export function pickBundleProductsForBudget(
  productIds: string[],
  products: Product[],
  budget: number,
  discountPercent: number,
  frequency: BundleFrequency = 'everyday',
): string[] {
  const catalogIds = resolveBundleProductIds(productIds, products)
  const ordered = filterBundleByFrequency(catalogIds, frequency, products)
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product))

  if (ordered.length === 0) return []

  const selected: Product[] = []
  let subtotal = 0

  for (const product of ordered) {
    const nextSubtotal = subtotal + product.price
    const nextTotal = nextSubtotal * (1 - discountPercent / 100)

    if (selected.length > 0 && nextTotal > budget) continue

    selected.push(product)
    subtotal = nextSubtotal

    if (nextTotal >= budget) break
  }

  if (selected.length > 0) {
    return selected.map((product) => product.id)
  }

  const affordable = [...ordered].sort((a, b) => a.price - b.price)
  for (const product of affordable) {
    const total = product.price * (1 - discountPercent / 100)
    if (total <= budget) return [product.id]
  }

  return [affordable[0]?.id].filter(Boolean)
}

export function getBundleBudgetMax(
  productIds: string[],
  products: Product[],
  discountPercent: number,
  frequency: BundleFrequency = 'everyday',
): number {
  const catalogIds = resolveBundleProductIds(productIds, products)
  const filtered = filterBundleByFrequency(catalogIds, frequency, products)
  const fullTotal = bundleTotal(filtered, products, discountPercent)

  if (fullTotal <= 0) return 500

  const withHeadroom = Math.ceil((fullTotal * 1.1) / 10) * 10
  return Math.max(300, withHeadroom)
}

export function getDefaultBundleBudget(
  productIds: string[],
  products: Product[],
  discountPercent: number,
  frequency: BundleFrequency = 'everyday',
): number {
  const catalogIds = resolveBundleProductIds(productIds, products)
  const filtered = filterBundleByFrequency(catalogIds, frequency, products)
  const fullTotal = bundleTotal(filtered, products, discountPercent)
  const maxBudget = getBundleBudgetMax(productIds, products, discountPercent, frequency)

  if (fullTotal <= 0) return Math.min(200, maxBudget)

  const target = Math.max(fullTotal * 0.92, fullTotal - 40)
  return Math.max(120, Math.min(maxBudget, Math.round(target / 10) * 10))
}

export function getBundleMatchPercent(
  productId: string,
  index: number,
  isPrimaryGoalMatch: boolean,
  products: Product[] = [],
): number {
  const tierBoost: Record<BundleProductTier, number> = {
    essential: 6,
    core: 4,
    support: 2,
    treatment: 1,
    premium: 0,
  }
  const base = 94 - index * 2
  const tier = getProductTier(productId, products)
  const goalBoost = isPrimaryGoalMatch ? 3 : 0
  return Math.min(99, Math.max(82, base + tierBoost[tier] + goalBoost))
}

export function describeBundleSelection(
  selectedProducts: Product[],
  frequency: BundleFrequency,
): string {
  if (selectedProducts.length === 0) {
    return 'Slide your budget up to unlock essentials from your AI routine.'
  }

  const hasEssential = selectedProducts.some(
    (p) => getProductTier(p.id, selectedProducts) === 'essential',
  )
  const hasBrush = selectedProducts.some((p) => getProductTier(p.id, selectedProducts) === 'core')
  const hasTreatment = selectedProducts.some(
    (p) =>
      getProductTier(p.id, selectedProducts) === 'treatment' ||
      getProductTier(p.id, selectedProducts) === 'premium',
  )

  const parts: string[] = []
  if (hasEssential && hasBrush) parts.push('a complete daily base')
  else if (hasEssential) parts.push('your core cleanser')
  else if (hasBrush) parts.push('an upgraded brush')

  if (hasTreatment) {
    parts.push(
      frequency === 'weekly'
        ? 'light whitening support'
        : 'targeted brightening extras',
    )
  }

  if (parts.length === 0) {
    return `${selectedProducts.length} picks matched to your smile profile.`
  }

  return `Includes ${parts.join(' plus ')} — tuned for ${frequency === 'everyday' ? 'daily' : frequency === 'few-times' ? 'regular' : 'light'} use.`
}
