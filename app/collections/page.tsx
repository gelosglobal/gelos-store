import { ShopByCollection } from '@/components/shop-by-collection'

export default function CollectionsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif font-bold md:text-5xl">Collections</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Browse curated categories — from flavored toothpastes to whitening kits and everyday essentials.
        </p>
      </div>

      <ShopByCollection className="bg-muted/20 pt-0" />
    </div>
  )
}
