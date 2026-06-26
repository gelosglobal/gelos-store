import {
  getKnownVariantLabelFromImageUrl,
  isOpaqueUploadFileKey,
} from '@/lib/variant-image-label-overrides'

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase())
}

/** Human-readable label from a variant image path when admin did not set a name. */
export function getVariantLabelFromImageUrl(
  imageUrl: string,
  category?: string,
): string | undefined {
  const knownLabel = getKnownVariantLabelFromImageUrl(imageUrl)
  if (knownLabel) return knownLabel

  const file = decodeURIComponent(imageUrl.split('/').pop() ?? '')
    .replace(/\.(png|jpe?g|webp|gif)$/i, '')
    .trim()

  if (!file || isOpaqueUploadFileKey(file)) return undefined

  let label = file
    .replace(/^mouthwash-cover-/i, '')
    .replace(/^mouthwash-/i, '')
    .replace(/-foaming-mouthwash$/i, '')
    .replace(/-fruit-energy$/i, '')
    .replace(/-toothpaste$/i, '')
    .replace(/-with-fruity-design$/i, '')
    .replace(/[._-]+/g, ' ')
    .trim()

  if (category === 'Whitening' && label) {
    return titleCase(label)
  }

  if (label === 'bb brushbl' || file === 'bb.brushbl') return 'Bamboo'
  if (label === 'bananaa') return 'Banana'
  if (label === 'mango inhaler' || file === 'mango-inhaler') return 'Mango'
  if (label === 'grape mint fruit energy' || file === 'grape-mint-fruit-energy') {
    return 'Grape Mint'
  }

  return titleCase(label)
}
