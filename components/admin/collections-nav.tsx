'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { productTagDefinitions } from '@/lib/product-tags'
import { cn } from '@/lib/utils'

export function CollectionsNav() {
  const pathname = usePathname()
  const isOverview = pathname === '/admin/collections'

  return (
    <nav className="flex flex-col gap-1 rounded-xl border border-neutral-200 bg-white p-2 sm:min-w-[200px]">
      <Link
        href="/admin/collections"
        className={cn(
          'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isOverview
            ? 'bg-neutral-100 text-neutral-950'
            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950',
        )}
      >
        Category tiles
      </Link>
      <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
        Product collections
      </p>
      <Link
        href="/admin/collections/bundles"
        className={cn(
          'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          pathname.startsWith('/admin/collections/bundles')
            ? 'bg-neutral-950 text-white'
            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950',
        )}
      >
        Bundles
      </Link>
      {productTagDefinitions
        .filter((tag) => tag.id !== 'bundle')
        .map((tag) => {
        const href = `/admin/collections/${tag.id}`
        const active = pathname === href
        return (
          <Link
            key={tag.id}
            href={href}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-neutral-950 text-white'
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950',
            )}
          >
            {tag.label}
          </Link>
        )
      })}
    </nav>
  )
}
