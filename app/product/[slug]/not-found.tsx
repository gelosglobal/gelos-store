import Link from 'next/link'

export default function ProductNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-white px-4 text-center">
      <h1 className="text-2xl font-bold text-neutral-950">Product not found</h1>
      <p className="mt-2 max-w-sm text-neutral-600">
        This product may have been removed or the link is incorrect.
      </p>
      <Link
        href="/shop"
        className="mt-8 inline-flex rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
      >
        Browse all products
      </Link>
    </div>
  )
}
