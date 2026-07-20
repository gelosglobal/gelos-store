import { normalizeImageUrl } from '@/lib/image-url'
import {
  getAdminVariantOptionForUrl,
  getVariantLabelForImage,
  hasAdminVariantPicker,
} from '@/lib/product-variant-images'
import { getToothbrushStyleLabel } from '@/lib/toothbrush-style-covers'
import { getToothpasteFlavorLabel } from '@/lib/toothpaste-flavor-covers'
import { getWellnessFlavorLabel } from '@/lib/wellness-flavor-covers'
import type { ProductVariantOption } from '@/lib/types/product-variant'
import type { Product } from '@/lib/types/product'

type VariantLabelProduct = Pick<Product, 'name' | 'image' | 'category'> & {
  variantImageOptions?: ProductVariantOption[]
}

export { getVariantLabelFromImageUrl } from '@/lib/variant-image-labels'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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
      return getToothbrushStyleLabel(product.name) || undefined
    case 'Water Flossers':
      return (
        product.name.replace(/ Water Flosser.*$/i, '').trim() ||
        product.name.replace(/ Flosser.*$/i, '').trim() ||
        undefined
      )
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

const CATEGORY_TITLE_SUFFIX: Record<string, string> = {
  Toothpaste: 'Toothpaste',
  Mouthwash: 'Mouthwash',
  'Tongue Scraper': 'Tongue Scraper',
  Toothbrushes: 'Toothbrush',
}

/** Build "Strawberry Toothpaste" from a flavour label + category. */
function buildFlavourProductTitle(
  product: VariantLabelProduct,
  flavourLabel: string,
): string {
  const label = flavourLabel.trim()
  if (!label) return product.name

  const suffix = CATEGORY_TITLE_SUFFIX[product.category]
  if (!suffix) return label

  if (new RegExp(`\\b${escapeRegExp(suffix)}$`, 'i').test(label)) return label
  return `${label} ${suffix}`
}

function isNameTokenAVariantLabel(
  product: VariantLabelProduct,
  nameLabel: string,
): boolean {
  return (product.variantImageOptions ?? []).some((option) => {
    const optionLabel = option.label.trim()
    return (
      Boolean(optionLabel) &&
      nameLabel.localeCompare(optionLabel, undefined, {
        sensitivity: 'accent',
      }) === 0
    )
  })
}

/**
 * True for catalogue parents like "Flavored Toothpaste" that own many flavour
 * tiles. Storefront should keep the parent name; PDP swaps after a choice.
 */
export function isGenericMultiFlavourProduct(
  product: VariantLabelProduct,
): boolean {
  if (!hasAdminVariantPicker(product)) return false
  const nameLabel = getProductLineVariantLabel(product as Product)
  if (!nameLabel) return true
  return !isNameTokenAVariantLabel(product, nameLabel)
}

/** Product title reflecting the currently selected flavour/style tile. */
export function getVariantDisplayName(
  product: VariantLabelProduct,
  activeImage: string,
): string {
  const mainImage = normalizeImageUrl(product.image)
  const selectedImage = normalizeImageUrl(activeImage)

  if (selectedImage === mainImage && !hasAdminVariantPicker(product)) {
    return product.name
  }

  const imageLabel = getVariantLabelForImage(product, selectedImage)
  const nameLabel = getProductLineVariantLabel(product as Product)

  const labelsMatch =
    nameLabel &&
    imageLabel &&
    nameLabel.localeCompare(imageLabel, undefined, { sensitivity: 'accent' }) ===
      0

  if (selectedImage === mainImage && labelsMatch) return product.name
  if (!imageLabel?.trim()) return product.name

  // Generic multi-flavour catalogue titles (e.g. "Flavored Toothpaste") should
  // update the H1 to the selected flavour: "Strawberry Toothpaste".
  if (hasAdminVariantPicker(product)) {
    if (!nameLabel || !isNameTokenAVariantLabel(product, nameLabel)) {
      return buildFlavourProductTitle(product, imageLabel)
    }
  }

  if (!nameLabel) return product.name

  // Only swap an embedded variant token (e.g. flavour in the title). When the line
  // label is the whole product name — common for toothbrush SKUs with colour tiles —
  // keep the catalogue name instead of replacing it with "Pink" / "Black".
  if (nameLabel.length >= product.name.length) return product.name

  const pattern = new RegExp(escapeRegExp(nameLabel), 'i')
  if (pattern.test(product.name)) {
    return product.name.replace(pattern, imageLabel)
  }

  return product.name
}

/** Map the visible variant tile on cards/PDP to cart line metadata. */
export function getVariantSelectionForCart(
  product: VariantLabelProduct,
  activeImage: string,
): { variantImage?: string; variantLabel?: string } {
  const mainImage = normalizeImageUrl(product.image)
  const selectedImage = normalizeImageUrl(activeImage)
  const imageLabel = getVariantLabelForImage(product, selectedImage)
  const nameLabel = getProductLineVariantLabel(product as Product)
  const displayName = getVariantDisplayName(product, activeImage)

  if (hasAdminVariantPicker(product)) {
    const storedOption = getAdminVariantOptionForUrl(product, selectedImage)
    const hasExplicitEmptyLabel = Boolean(
      storedOption && !storedOption.label.trim(),
    )

    return {
      variantImage: selectedImage,
      variantLabel: hasExplicitEmptyLabel
        ? undefined
        : imageLabel?.trim() ||
          (displayName !== product.name ? displayName : undefined) ||
          (storedOption ? undefined : nameLabel),
    }
  }

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
