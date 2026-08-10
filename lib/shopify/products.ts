import { getProductSlug } from '@/lib/product-utils'
import { SHOPIFY_GALLERY_METAFIELD_SELECTION } from '@/lib/shopify/gallery-metafield'
import { SHOPIFY_PDP_METAFIELD_SELECTION } from '@/lib/shopify/pdp-metafield'
import {
  mapShopifyProduct,
  type ShopifyMappedProduct,
  type ShopifyStorefrontProduct,
} from '@/lib/shopify/map-product'
import { shopifyStorefrontFetch } from '@/lib/shopify/storefront-client'

const PRODUCT_FIELDS = /* GraphQL */ `
  id
  handle
  title
  description
  productType
  tags
  availableForSale
  featuredImage {
    url
    altText
  }
  images(first: 20) {
    nodes {
      url
      altText
    }
  }
  ${SHOPIFY_GALLERY_METAFIELD_SELECTION}
  ${SHOPIFY_PDP_METAFIELD_SELECTION}
  priceRange {
    minVariantPrice {
      amount
      currencyCode
    }
  }
  compareAtPriceRange {
    maxVariantPrice {
      amount
      currencyCode
    }
  }
  variants(first: 50) {
    nodes {
      id
      title
      availableForSale
      image {
        url
        altText
      }
      price {
        amount
        currencyCode
      }
      compareAtPrice {
        amount
        currencyCode
      }
      selectedOptions {
        name
        value
      }
    }
  }
`

const PRODUCTS_QUERY = /* GraphQL */ `
  query GelosProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ${PRODUCT_FIELDS}
      }
    }
  }
`

const PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  query GelosProductByHandle($handle: String!) {
    product(handle: $handle) {
      ${PRODUCT_FIELDS}
    }
  }
`

type ProductsQueryData = {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
    nodes: ShopifyStorefrontProduct[]
  }
}

type ProductByHandleData = {
  product: ShopifyStorefrontProduct | null
}

export async function getShopifyProducts(): Promise<ShopifyMappedProduct[]> {
  const mapped: ShopifyMappedProduct[] = []
  let after: string | null = null
  let hasNextPage = true

  while (hasNextPage) {
    const data: ProductsQueryData = await shopifyStorefrontFetch<ProductsQueryData>(
      PRODUCTS_QUERY,
      { first: 50, after },
    )

    for (const node of data.products.nodes) {
      const product = mapShopifyProduct(node)
      // Include every product the Storefront API returns (published to this channel).
      // Out-of-stock items stay visible with stock 0 rather than disappearing.
      if (product) mapped.push(product)
    }

    hasNextPage = data.products.pageInfo.hasNextPage
    after = data.products.pageInfo.endCursor
    if (!hasNextPage) break
  }

  return mapped
}

export async function getShopifyProductBySlugOrId(
  slugOrId: string,
): Promise<ShopifyMappedProduct | null> {
  const all = await getShopifyProducts()
  const direct = all.find(
    (product) =>
      product.id === slugOrId ||
      product.handle === slugOrId ||
      getProductSlug(product) === slugOrId ||
      product.shopifyProductGid === slugOrId ||
      product.shopifyVariantGid === slugOrId,
  )
  if (direct) return direct

  try {
    const data = await shopifyStorefrontFetch<ProductByHandleData>(
      PRODUCT_BY_HANDLE_QUERY,
      { handle: slugOrId },
    )
    if (!data.product) return null
    return mapShopifyProduct(data.product)
  } catch (error) {
    console.error('[getShopifyProductBySlugOrId]', error)
    return null
  }
}
