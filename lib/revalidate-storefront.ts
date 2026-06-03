import { revalidatePath } from 'next/cache'

/** Bust Next.js cache for storefront pages after admin catalog changes. */
export function revalidateStorefront(productSlug?: string) {
  revalidatePath('/', 'layout')
  revalidatePath('/')
  revalidatePath('/shop')
  revalidatePath('/api/products')
  revalidatePath('/api/tag-collections')

  if (productSlug) {
    revalidatePath(`/product/${productSlug}`)
  }
}
