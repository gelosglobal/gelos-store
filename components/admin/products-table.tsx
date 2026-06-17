'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Edit2, ExternalLink, Trash2 } from 'lucide-react'
import { isExternalImageUrl } from '@/lib/image-url'
import { getEffectiveProductTags, getTagDefinition } from '@/lib/product-tags'
import { getProductHref } from '@/lib/product-utils'
import type { Product } from '@/lib/types/product'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type ProductsTableProps = {
  products: Product[]
  onDelete: (product: Product) => void
}

function truncateDescription(text: string, maxLength = 100): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength).trimEnd()}…`
}

export function ProductsTable({ products, onDelete }: ProductsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="bg-neutral-50/80 hover:bg-neutral-50/80">
            <TableHead className="w-[38%] pl-6">Product</TableHead>
            <TableHead className="w-[18%]">Category</TableHead>
            <TableHead className="w-[12%]">Price</TableHead>
            <TableHead className="w-[10%]">Stock</TableHead>
            <TableHead className="w-[22%] pr-6 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const shortDescription = truncateDescription(product.description)

            return (
            <TableRow key={product.id}>
              <TableCell className="whitespace-normal pl-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    <Image
                      key={product.image}
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-contain p-1"
                      sizes="48px"
                      unoptimized={isExternalImageUrl(product.image)}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-neutral-950">
                      {product.name}
                    </p>
                    <p
                      className="line-clamp-2 text-xs text-neutral-500"
                      title={product.description}
                    >
                      {shortDescription}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="whitespace-normal">
                <div className="flex flex-col gap-1.5">
                  <Badge variant="secondary">{product.category}</Badge>
                  {getEffectiveProductTags(product).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {getEffectiveProductTags(product).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-[10px] font-normal"
                        >
                          {getTagDefinition(tag)?.label ?? tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-semibold text-[#E91E8C]">
                GH₵{product.price.toFixed(0)}
              </TableCell>
              <TableCell>
                <span
                  className={
                    product.stock < 20
                      ? 'font-semibold text-amber-700'
                      : 'text-neutral-700'
                  }
                >
                  {product.stock}
                </span>
              </TableCell>
              <TableCell className="pr-6">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link
                      href={getProductHref(product)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View ${product.name} on store`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      aria-label={`Edit ${product.name}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => onDelete(product)}
                    aria-label={`Delete ${product.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
