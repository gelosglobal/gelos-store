import { normalizeImageUrl } from '@/lib/image-url'
import { getToothpasteFlavorLabel } from '@/lib/toothpaste-flavor-covers'
import {
  getKnownVariantLabelFromImageUrl,
  isOpaqueUploadFileKey,
} from '@/lib/variant-image-label-overrides'
import { getWellnessFlavorLabel } from '@/lib/wellness-flavor-covers'
import type { Product } from '@/lib/types/product'

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase())
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Human-readable label from a variant image path (admin flavour/style tiles). */
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
    .replace(/-/g, ' ')
    .trim()

  if (category === 'Whitening' && label) {
    return titleCase(label)
  }

  if (label === 'bb brushbl') return 'Brush style'
  if (label === 'bananaa') return 'Banana'
  if (label === 'mango inhaler' || file === 'mango-inhaler') return 'Mango'
  if (label === 'grape mint fruit energy' || file === 'grape-mint-fruit-energy') {
    return 'Grape Mint'
  }

  return titleCase(label)
}

/** Flavour/style label for a specific product (category variant pages). */
export function getProductLineVariantLabel(product: Product): string | undefined {
  switch (product.category) {
    case 'Toothpaste': {
      const label = getToothpasteFlavorLabel(product.name)
      return label || undefined
    }
    case 'Mouthwash':
      return (
        product.name.replace(/ Foaming Mouthwash$/i, '').trim() ||
        product.name.replace(/ Mouthwash$/i, '').trim() ||
        undefined
      )
    case 'Tongue Scraper':
      return product.name.replace(/ Tongue Scraper$/i, '').trim() || undefined
    case 'Whitening':
      return product.name.replace(/ Whitening.*$/i, '').trim() || undefined
    case 'Wellness': {
      const label = getWellnessFlavorLabel(product.name)
      return label || undefined
    }
    case 'Toothbrushes':
      return product.name.replace(/ Toothbrush.*$/i, '').trim() || undefined
    default:
      return undefined
  }
}

export function getCartDisplayName(
  productName: string,
  variantLabel?: string,
): string {
  if (variantLabel?.trim()) return variantLabel.trim()
  return productName
}

/** Product title reflecting the currently selected flavour/style tile. */
export function getVariantDisplayName(
  product: Pick<Product, 'name' | 'image' | 'category'>,
  activeImage: string,
): string {
  const mainImage = normalizeImageUrl(product.image)
  const selectedImage = normalizeImageUrl(activeImage)
  const imageLabel = getVariantLabelFromImageUrl(selectedImage, product.category)
  const nameLabel = getProductLineVariantLabel(product as Product)

  const labelsMatch =
    nameLabel &&
    imageLabel &&
    nameLabel.localeCompare(imageLabel, undefined, { sensitivity: 'accent' }) ===
      0

  if (selectedImage === mainImage && labelsMatch) return product.name
  if (!imageLabel?.trim() || !nameLabel) return product.name

  const pattern = new RegExp(escapeRegExp(nameLabel), 'i')
  if (pattern.test(product.name)) {
    return product.name.replace(pattern, imageLabel)
  }

  return product.name
}

/** Map the visible variant tile on cards/PDP to cart line metadata. */
export function getVariantSelectionForCart(
  product: Pick<Product, 'name' | 'image' | 'category'>,
  activeImage: string,
): { variantImage?: string; variantLabel?: string } {
  const mainImage = normalizeImageUrl(product.image)
  const selectedImage = normalizeImageUrl(activeImage)
  const imageLabel = getVariantLabelFromImageUrl(selectedImage, product.category)
  const nameLabel = getProductLineVariantLabel(product as Product)
  const displayName = getVariantDisplayName(product, activeImage)

  if (selectedImage !== mainImage) {
    return {
      variantImage: selectedImage,
      variantLabel: displayName !== product.name ? displayName : imageLabel,
    }
  }

  // Image and name can disagree (e.g. mango tile on a grape-titled SKU).
  if (
    nameLabel &&
    imageLabel &&
    nameLabel.localeCompare(imageLabel, undefined, { sensitivity: 'accent' }) !== 0
  ) {
    return {
      variantImage: selectedImage,
      variantLabel: displayName !== product.name ? displayName : imageLabel,
    }
  }

  if (nameLabel) return { variantLabel: nameLabel }
  if (imageLabel?.trim()) return { variantLabel: imageLabel }
  return {}
}
