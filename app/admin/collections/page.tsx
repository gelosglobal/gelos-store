'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, LayoutGrid } from 'lucide-react'
import { collections } from '@/lib/collections'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function AdminCollectionsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Collections"
        description="Homepage and shop collection tiles. Preview how shoppers discover categories."
      >
        <Button variant="outline" asChild className="rounded-full">
          <Link href="/collections" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            View storefront
          </Link>
        </Button>
      </AdminPageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => {
          const href =
            collection.href ??
            `/shop?category=${encodeURIComponent(collection.category)}`

          return (
            <div
              key={collection.id}
              className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
            >
              <div className="relative aspect-[4/3] bg-neutral-100">
                <Image
                  src={collection.image}
                  alt={collection.title}
                  fill
                  className={
                    collection.image.endsWith('.png')
                      ? 'object-contain p-4'
                      : 'object-cover'
                  }
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                {collection.featured && (
                  <Badge className="absolute left-3 top-3 bg-white text-neutral-950">
                    Featured
                  </Badge>
                )}
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <h3 className="font-semibold text-neutral-950">
                    {collection.title}
                  </h3>
                  {collection.description && (
                    <p className="mt-1 text-xs text-neutral-500">
                      {collection.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary">{collection.category}</Badge>
                  <span className="text-neutral-400">·</span>
                  <span className="truncate text-neutral-500">{href}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={href} target="_blank" rel="noopener noreferrer">
                    <LayoutGrid className="mr-2 h-3.5 w-3.5" />
                    Open collection
                  </Link>
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
