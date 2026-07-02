'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { ProductAdminVariantPicker } from '@/components/product-admin-variant-picker'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  buildDefaultBundleVariantSelections,
  isBundleVariantInStock,
} from '@/lib/bundle-variant-selection'
import { isExternalImageUrl } from '@/lib/image-url'
import {
  getProductVariantPickerOptions,
  getVariantPickerLabel,
} from '@/lib/product-variant-images'
import type { Product } from '@/lib/types/product'

type BundleVariantDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  bundleTitle: string
  products: Product[]
  onConfirm: (selections: Record<string, string>) => void
}

export function BundleVariantDialog({
  open,
  onOpenChange,
  bundleTitle,
  products,
  onConfirm,
}: BundleVariantDialogProps) {
  const [selections, setSelections] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    setSelections(buildDefaultBundleVariantSelections(products))
  }, [open, products])

  const allInStock = useMemo(
    () =>
      products.every((product) =>
        isBundleVariantInStock(product, selections[product.id] ?? ''),
      ),
    [products, selections],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose your flavours</DialogTitle>
          <DialogDescription>
            Pick a flavour or style for each item in {bundleTitle} before adding
            to your cart.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {products.map((product) => {
            const options = getProductVariantPickerOptions(product)
            const activeImage = selections[product.id] ?? options[0]?.url ?? product.image

            return (
              <div
                key={product.id}
                className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-white">
                    <Image
                      src={product.image}
                      alt=""
                      fill
                      className="object-contain p-1"
                      unoptimized={isExternalImageUrl(product.image)}
                    />
                  </div>
                  <p className="text-sm font-semibold text-neutral-950">
                    {product.name}
                  </p>
                </div>

                <ProductAdminVariantPicker
                  options={options}
                  activeImage={activeImage}
                  onSelect={(url) =>
                    setSelections((current) => ({
                      ...current,
                      [product.id]: url,
                    }))
                  }
                  label={getVariantPickerLabel(product.category)}
                  isOptionDisabled={(option) =>
                    !isBundleVariantInStock(product, option.url)
                  }
                />
              </div>
            )
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-[#E5515F] text-white hover:bg-[#D64555]"
            disabled={!allInStock}
            onClick={() => {
              onConfirm(selections)
              onOpenChange(false)
            }}
          >
            Add bundle to cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
