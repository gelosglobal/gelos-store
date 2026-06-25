'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import {
  BadgePercent,
  Package,
  RotateCcw,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import { useCart } from '@/components/cart-provider'
import { useLocation } from '@/components/location-provider'
import { useProducts } from '@/components/products-provider'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  type BundleFrequency,
  describeBundleSelection,
  getBundleBudgetMax,
} from '@/lib/gelos-ai/bundle-builder'
import { smileTestGoalLabels } from '@/lib/gelos-ai/smile-test-config'
import {
  getDefaultBundleBudget,
  pickBundleProductsForBudget,
} from '@/lib/gelos-ai/smile-test-results'
import type { SmileTestGoalId } from '@/lib/gelos-ai/smile-test-types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const trustBadges = [
  { icon: ShieldCheck, label: 'Best price guarantee' },
  { icon: Truck, label: 'Free delivery over GH₵150' },
  { icon: BadgePercent, label: '20% cheaper than buying individually' },
  { icon: RotateCcw, label: 'Easy returns' },
] as const

type SmileTestBundleBuilderProps = {
  bundleProductIds: string[]
  goals?: SmileTestGoalId[]
  goalLabels?: string[]
  discountPercent: number
}

export function SmileTestBundleBuilder({
  bundleProductIds,
  goals = [],
  goalLabels,
  discountPercent,
}: SmileTestBundleBuilderProps) {
  const { products } = useProducts()
  const { addItem } = useCart()
  const { formatPrice } = useLocation()
  const [frequency, setFrequency] = useState<BundleFrequency>('everyday')

  const maxBudget = useMemo(
    () =>
      getBundleBudgetMax(
        bundleProductIds,
        products,
        discountPercent,
        frequency,
      ),
    [bundleProductIds, discountPercent, frequency, products],
  )

  const defaultBudget = useMemo(
    () =>
      getDefaultBundleBudget(
        bundleProductIds,
        products,
        discountPercent,
        frequency,
      ),
    [bundleProductIds, discountPercent, frequency, products],
  )

  const [budget, setBudget] = useState(defaultBudget)

  useEffect(() => {
    setBudget(defaultBudget)
  }, [defaultBudget])

  useEffect(() => {
    setBudget((current) => Math.min(current, maxBudget))
  }, [maxBudget])

  const selectedIds = useMemo(
    () =>
      pickBundleProductsForBudget(
        bundleProductIds,
        products,
        budget,
        discountPercent,
        frequency,
      ),
    [budget, bundleProductIds, discountPercent, frequency, products],
  )

  const selectedProducts = useMemo(
    () =>
      selectedIds
        .map((id) => products.find((product) => product.id === id))
        .filter((product): product is NonNullable<typeof product> => Boolean(product)),
    [products, selectedIds],
  )

  const subtotal = selectedProducts.reduce((sum, product) => sum + product.price, 0)
  const total = subtotal * (1 - discountPercent / 100)
  const savings = subtotal - total

  const displayGoals =
    goalLabels && goalLabels.length > 0
      ? goalLabels
      : goals.map((goal) => smileTestGoalLabels[goal])

  const bundleSummary = describeBundleSelection(selectedProducts, frequency)

  const addBundleToCart = () => {
    selectedIds.forEach((productId) => addItem(productId, 1))
    toast.success('Your AI bundle was added to cart')
  }

  return (
    <section className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold text-neutral-950">AI Bundle Builder</h2>
          <span className="rounded-full bg-[#F0FDF4] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#65A30D]">
            Personalized
          </span>
        </div>
        <p className="mt-1 text-sm text-neutral-600">
          Essentials first — then add extras as your budget allows.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-neutral-950">Set your budget</p>
              <p className="text-sm font-bold text-[#65A30D]">{formatPrice(budget)}</p>
            </div>
            <Slider
              min={100}
              max={maxBudget}
              step={10}
              value={[Math.min(budget, maxBudget)]}
              onValueChange={(value) => setBudget(value[0] ?? budget)}
              className="[&_[data-slot=slider-range]]:bg-[#84CC16] [&_[data-slot=slider-thumb]]:border-[#84CC16]"
            />
            <div className="mt-2 flex justify-between text-xs text-neutral-400">
              <span>{formatPrice(100)}</span>
              <span>{formatPrice(maxBudget)}</span>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-neutral-950">What are your top goals?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {displayGoals.map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  {label}
                </span>
              ))}
              {displayGoals.length === 0 ? (
                <span className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-500">
                  Matched from your results
                </span>
              ) : null}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-neutral-950">How often will you use?</p>
            <Select
              value={frequency}
              onValueChange={(value) => setFrequency(value as BundleFrequency)}
            >
              <SelectTrigger className="mt-3 w-full border-neutral-200 bg-white">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyday">Every day — full routine</SelectItem>
                <SelectItem value="few-times">Few times a week</SelectItem>
                <SelectItem value="weekly">Weekly touch-ups</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-2 text-xs leading-relaxed text-neutral-500">
              Frequency adjusts which products we prioritize in your bundle.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-[#F7FBFE] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-neutral-950">Your AI Bundle</p>
            <span className="rounded-full bg-[#DCFCE7] px-2.5 py-1 text-xs font-bold text-[#15803D]">
              {selectedProducts.length} items
            </span>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-neutral-600">{bundleSummary}</p>

          <div className="relative mt-4 flex min-h-32 items-center justify-center overflow-hidden rounded-xl bg-white sm:min-h-36">
            <div className="flex items-end justify-center gap-1 px-2">
              {selectedProducts.slice(0, 6).map((product, index) => (
                <div
                  key={product.id}
                  className={cn(
                    'relative overflow-hidden rounded-lg border border-neutral-100 bg-white shadow-sm',
                    index % 2 === 0 ? 'size-14' : 'size-16',
                  )}
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain p-1"
                    sizes="64px"
                  />
                </div>
              ))}
            </div>
            {selectedProducts.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-neutral-500">
                <Package className="size-4" />
                Adjust budget to build a bundle
              </div>
            ) : null}
          </div>

          {selectedProducts.length > 0 ? (
            <ul className="mt-4 space-y-2 border-t border-neutral-200/80 pt-4">
              {selectedProducts.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span className="line-clamp-1 font-medium text-neutral-800">
                    {product.name}
                  </span>
                  <span className="shrink-0 text-neutral-500">
                    {formatPrice(product.price)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-bold text-neutral-950">{formatPrice(total)}</p>
              <p className="mt-1 text-xs text-[#15803D]">
                You save {formatPrice(savings)}
              </p>
            </div>
            <span className="rounded-full bg-[#DCFCE7] px-2.5 py-1 text-xs font-bold text-[#15803D]">
              Save {discountPercent}%
            </span>
          </div>

          <button
            type="button"
            onClick={addBundleToCart}
            disabled={selectedProducts.length === 0}
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#84CC16] px-5 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-neutral-950 transition-colors hover:bg-[#73b512] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add bundle to cart
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-5 sm:grid-cols-4">
        {trustBadges.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-start gap-2 text-[11px] leading-snug text-neutral-500">
            <Icon className="mt-0.5 size-3.5 shrink-0 text-[#84CC16]" />
            {label}
          </div>
        ))}
      </div>
    </section>
  )
}
