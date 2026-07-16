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
  getDefaultBundleVariantImage,
  isBundleVariantInStock,
} from '@/lib/bundle-variant-selection'
import { isExternalImageUrl } from '@/lib/image-url'
import {
  getAvailableStockForVariant,
  getProductVariantPickerOptions,
  getVariantPickerLabel,
} from '@/lib/product-variant-images'
import { getVariantSelectionForCart } from '@/lib/variant-display'
import type { Product } from '@/lib/types/product'

type ProductVariantChoiceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product
  quantity?: number
  onConfirm: (selection: {
    variantImage?: string
    variantLabel?: string
  }) => void
}

export function ProductVariantChoiceDialog({
  open,
  onOpenChange,
  product,
  quantity = 1,
  onConfirm,
}: ProductVariantChoiceDialogProps) {
  const options = useMemo(
    () => getProductVariantPickerOptions(product),
    [product],
  )
  const [selectedImage, setSelectedImage] = useState('')

  useEffect(() => {
    if (!open) return
    setSelectedImage(getDefaultBundleVariantImage(product))
  }, [open, product])

  const selectedInStock = selectedImage
    ? isBundleVariantInStock(product, selectedImage)
    : false

  const hasAnyInStock = options.some((option) =>
    isBundleVariantInStock(product, option.url),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose your flavours</DialogTitle>
          <DialogDescription>
            Pick a flavour or style for {product.name} before adding to your
            cart.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
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
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-950">
                {product.name}
              </p>
              {quantity > 1 ? (
                <p className="text-xs text-neutral-500">Qty {quantity}</p>
              ) : null}
            </div>
          </div>

          <ProductAdminVariantPicker
            options={options}
            activeImage={selectedImage || null}
            onSelect={setSelectedImage}
            label={getVariantPickerLabel(product.category)}
            layout="grid"
            isOptionDisabled={(option) =>
              getAvailableStockForVariant(product, option.url) <= 0
            }
          />
        </div>

        {!hasAnyInStock ? (
          <p className="text-sm font-medium text-red-600">
            All flavours are currently out of stock.
          </p>
        ) : !selectedInStock ? (
          <p className="text-sm font-medium text-red-600">
            This flavour is out of stock. Pick another.
          </p>
        ) : null}

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
            className="bg-neutral-950 text-white hover:bg-neutral-800"
            disabled={!selectedInStock}
            onClick={() => {
              if (!selectedImage || !selectedInStock) return
              onConfirm(getVariantSelectionForCart(product, selectedImage))
              onOpenChange(false)
            }}
          >
            Add to cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
