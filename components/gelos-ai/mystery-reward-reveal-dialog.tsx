'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  Copy,
  Gift,
  Loader2,
  Mail,
  ShoppingBag,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCart } from '@/components/cart-provider'
import { useLocation } from '@/components/location-provider'
import { useProducts } from '@/components/products-provider'
import { useStorePromotions } from '@/components/store-promotions-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  buildMysteryRewardBoard,
  getMysteryRewardIcon,
  getWinnerCard,
  type MysteryRewardBoard,
  type MysteryRewardCard,
} from '@/lib/gelos-ai/mystery-reward'
import { applySmileReward } from '@/lib/gelos-ai/smile-reward-storage'
import type { SmileScanReport } from '@/lib/gelos-ai/smile-scan-types'
import { getProductHref } from '@/lib/product-utils'
import { cn } from '@/lib/utils'

type MysteryRewardRevealDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  board: MysteryRewardBoard | null
  report: SmileScanReport | null
  customerName?: string
  scanId?: string
}

type DialogPhase = 'email' | 'pick' | 'already_claimed' | 'revealed'

function MysteryCardFace({
  card,
  isWinner,
  flipped,
  dimmed,
}: {
  card: MysteryRewardCard
  isWinner: boolean
  flipped: boolean
  dimmed?: boolean
}) {
  const Icon = getMysteryRewardIcon(card.type)
  const product = card.product

  return (
    <div
      className={cn(
        'relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]',
        flipped && '[transform:rotateY(180deg)]',
        dimmed && 'opacity-60',
      )}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-3 text-center [backface-visibility:hidden]">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-[#84CC16]/40 bg-[#84CC16]/10">
          <span className="text-2xl font-black text-[#84CC16]">?</span>
        </div>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#84CC16]">
          Mystery
        </p>
      </div>

      <div
        className={cn(
          'absolute inset-0 flex flex-col overflow-hidden rounded-2xl border text-left [backface-visibility:hidden] [transform:rotateY(180deg)]',
          isWinner
            ? 'border-[#84CC16]/40 bg-white text-neutral-950 shadow-lg shadow-[#84CC16]/10'
            : 'border-white/10 bg-neutral-900/90 text-white',
        )}
      >
        {product?.image && isWinner ? (
          <div className="relative h-16 w-full bg-neutral-100">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="120px"
            />
          </div>
        ) : (
          <div
            className={cn(
              'flex h-16 items-center justify-center',
              isWinner ? 'bg-[#84CC16]/10' : 'bg-white/5',
            )}
          >
            <Icon className={cn('h-6 w-6', isWinner ? 'text-[#4d7c0f]' : 'text-neutral-300')} />
          </div>
        )}

        <div className="flex flex-1 flex-col p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
            {card.subtitle}
          </p>
          <p className="mt-0.5 line-clamp-2 text-sm font-bold leading-tight">{card.title}</p>
          {isWinner && card.promoCode ? (
            <p className="mt-1 font-mono text-[11px] font-bold text-[#4d7c0f]">
              {card.promoCode}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function MysteryRewardRevealDialog({
  open,
  onOpenChange,
  board,
  report,
  customerName,
  scanId,
}: MysteryRewardRevealDialogProps) {
  const { products } = useProducts()
  const { formatPrice } = useLocation()
  const { addItem } = useCart()
  const { promotions, setAppliedPromoCode } = useStorePromotions()

  const [resolvedBoard, setResolvedBoard] = useState<MysteryRewardBoard | null>(null)
  const [phase, setPhase] = useState<DialogPhase>('email')
  const [email, setEmail] = useState('')
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [isFlipping, setIsFlipping] = useState(false)
  const [showOthers, setShowOthers] = useState(false)
  const [copied, setCopied] = useState(false)

  const firstName = customerName?.trim().split(/\s+/)[0]

  useEffect(() => {
    if (!open) {
      setPhase('email')
      setEmail('')
      setCheckingEmail(false)
      setClaiming(false)
      setSelectedCardId(null)
      setIsFlipping(false)
      setShowOthers(false)
      setCopied(false)
      setResolvedBoard(null)
      return
    }

    if (board) {
      setResolvedBoard(board)
      return
    }

    if (report) {
      setResolvedBoard(buildMysteryRewardBoard(report, products))
    }
  }, [open, board, report, products])

  const winner = useMemo(
    () => (resolvedBoard ? getWinnerCard(resolvedBoard) : null),
    [resolvedBoard],
  )

  const revealed = phase === 'revealed' && Boolean(selectedCardId && winner)

  const verifyEmail = async () => {
    const trimmed = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Enter a valid email to claim your reward')
      return
    }

    setCheckingEmail(true)
    try {
      const res = await fetch('/api/store/smile-reward/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      const data = (await res.json()) as {
        eligible?: boolean
        alreadyClaimed?: boolean
        error?: string
      }

      if (!res.ok) throw new Error(data.error ?? 'Could not verify email')

      if (data.alreadyClaimed || !data.eligible) {
        setPhase('already_claimed')
        return
      }

      setPhase('pick')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not verify email')
    } finally {
      setCheckingEmail(false)
    }
  }

  const handlePickCard = async (cardId: string) => {
    if (
      !resolvedBoard ||
      !winner ||
      selectedCardId ||
      isFlipping ||
      claiming ||
      phase !== 'pick'
    ) {
      return
    }

    setClaiming(true)
    try {
      const productHref = winner.product
        ? getProductHref(winner.product)
        : winner.productPick?.href

      const res = await fetch('/api/store/smile-reward/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          customerName,
          scanId,
          winnerCardId: winner.id,
          rewardType: winner.type,
          rewardTitle: winner.title,
          promoCode: winner.promoCode,
          productHref,
        }),
      })

      const data = (await res.json()) as {
        ok?: boolean
        error?: string
        alreadyClaimed?: boolean
      }

      if (!res.ok) {
        if (data.alreadyClaimed) setPhase('already_claimed')
        throw new Error(data.error ?? 'Failed to claim reward')
      }

      setSelectedCardId(cardId)
      setIsFlipping(true)
      setPhase('revealed')

      const applied = applySmileReward(winner, promotions.promos)
      if (applied.promoApplied) {
        setAppliedPromoCode(applied.promoApplied)
      }

      window.setTimeout(() => {
        setIsFlipping(false)
        setShowOthers(true)

        if (applied.promoApplied) {
          toast.success('Reward claimed', {
            description: `Code ${applied.promoApplied} applied at checkout.`,
          })
        } else if (applied.freeShippingApplied) {
          toast.success('Reward claimed', {
            description: 'Free shipping will apply on your next checkout.',
          })
        } else {
          toast.success('Reward claimed')
        }
      }, 650)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to claim reward')
    } finally {
      setClaiming(false)
    }
  }

  const handleCopyCode = async () => {
    if (!winner?.promoCode) return
    try {
      await navigator.clipboard.writeText(winner.promoCode)
      setCopied(true)
      toast.success('Code copied')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy code')
    }
  }

  const handleAddToCart = () => {
    if (!winner?.product) return
    addItem(winner.product, 1)
    toast.success('Added to cart', { description: winner.product.name })
    onOpenChange(false)
  }

  if (!resolvedBoard) return null

  const productHref = winner?.product
    ? getProductHref(winner.product)
    : winner?.productPick?.href ?? '/shop'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={revealed || phase === 'already_claimed'}
        className="max-w-lg overflow-hidden rounded-3xl border-neutral-200 p-0 sm:max-w-lg"
      >
        <div className="relative overflow-hidden bg-neutral-950 px-5 pb-5 pt-7 text-white sm:px-6 sm:pb-6 sm:pt-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 0%, rgba(132,204,22,0.35), transparent 45%), radial-gradient(circle at 80% 20%, rgba(79,108,247,0.25), transparent 40%)',
            }}
          />

          <div className="relative text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#84CC16]/20 text-[#84CC16]">
              <Gift className="h-5 w-5" />
            </div>
            <DialogTitle className="mt-3 text-xl font-bold tracking-tight text-white sm:text-2xl">
              {phase === 'email' && 'Claim your mystery reward'}
              {phase === 'pick' && 'Pick your mystery card'}
              {phase === 'already_claimed' && 'Reward already claimed'}
              {revealed && 'You won!'}
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-neutral-300">
              {phase === 'email' &&
                'Enter your email to unlock the cards. One smile scan reward per email.'}
              {phase === 'pick' &&
                'Choose one of six cards — discounts, free shipping, product picks & more.'}
              {phase === 'already_claimed' &&
                'This email has already been used to claim a smile scan reward.'}
              {revealed &&
                (firstName
                  ? `${firstName}, here's your smile scan reward.`
                  : "Here's your smile scan reward.")}
            </DialogDescription>
          </div>

          {phase === 'email' ? (
            <div className="relative mt-5 space-y-4 text-left">
              <div className="space-y-2">
                <Label htmlFor="reward-email" className="text-neutral-200">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input
                    id="reward-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void verifyEmail()
                    }}
                    placeholder="you@example.com"
                    className="h-11 border-white/15 bg-white/10 pl-10 text-white placeholder:text-neutral-500"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-neutral-500">
                  We&apos;ll use this to make sure each person claims one reward only.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => void verifyEmail()}
                disabled={checkingEmail || !email.trim()}
                className="h-11 w-full rounded-full bg-[#84CC16] text-base font-semibold text-neutral-950 hover:bg-[#73b512]"
              >
                {checkingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking…
                  </>
                ) : (
                  'Continue to mystery cards'
                )}
              </Button>
            </div>
          ) : null}

          {phase === 'already_claimed' ? (
            <div className="relative mt-5 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
                Each email can claim one mystery reward. If you think this is a mistake, contact
                us and we&apos;ll help.
              </div>
              <Button
                asChild
                className="h-11 w-full rounded-full bg-white text-neutral-950 hover:bg-neutral-100"
              >
                <Link href="/shop" onClick={() => onOpenChange(false)}>
                  Continue shopping
                </Link>
              </Button>
            </div>
          ) : null}

          {phase === 'pick' || revealed ? (
            <div className="relative mt-5 grid grid-cols-3 gap-2.5 sm:gap-3">
              {resolvedBoard.cards.map((card) => {
                const isSelected = selectedCardId === card.id
                const isWinnerCard = card.id === resolvedBoard.winnerCardId
                const flipped = isSelected || (showOthers && !isSelected)

                return (
                  <button
                    key={card.id}
                    type="button"
                    disabled={Boolean(selectedCardId) || claiming || phase !== 'pick'}
                    onClick={() => void handlePickCard(card.id)}
                    className={cn(
                      'group aspect-[4/5] w-full [perspective:900px]',
                      phase === 'pick' &&
                        !selectedCardId &&
                        !claiming &&
                        'cursor-pointer hover:scale-[1.02]',
                      (selectedCardId || claiming) && !isSelected && 'cursor-default',
                    )}
                  >
                    <MysteryCardFace
                      card={isSelected && winner ? winner : card}
                      isWinner={isSelected ? true : isWinnerCard && showOthers}
                      flipped={flipped}
                      dimmed={showOthers && !isSelected}
                    />
                  </button>
                )
              })}
            </div>
          ) : null}

          {revealed && winner ? (
            <div className="relative mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
              <div className="flex items-start gap-3">
                {winner.product?.image ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-800">
                    <Image
                      src={winner.product.image}
                      alt={winner.product.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#84CC16]/15 text-[#84CC16]">
                    <Sparkles className="h-7 w-7" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#84CC16]">
                    {winner.subtitle}
                  </p>
                  <p className="mt-1 text-lg font-bold leading-tight">{winner.title}</p>
                  {winner.product ? (
                    <p className="mt-1 text-sm font-semibold text-neutral-200">
                      {formatPrice(winner.product.price)}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                    {winner.description}
                  </p>
                  <p className="mt-2 text-xs text-neutral-500">
                    Claimed for {email.trim()}
                  </p>
                  {winner.promoCode ? (
                    <div className="mt-3 flex items-center gap-2">
                      <code className="rounded-lg bg-black/30 px-3 py-1.5 font-mono text-sm font-bold text-white">
                        {winner.promoCode}
                      </code>
                      <button
                        type="button"
                        onClick={() => void handleCopyCode()}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
                      >
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                {winner.type === 'product_gift' && winner.product ? (
                  <>
                    <Button
                      asChild
                      className="h-10 flex-1 rounded-full bg-[#84CC16] text-neutral-950 hover:bg-[#73b512]"
                    >
                      <Link href={productHref} onClick={() => onOpenChange(false)}>
                        View product
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddToCart}
                      className="h-10 flex-1 rounded-full border-white/20 bg-transparent text-white hover:bg-white/10"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Add to cart
                    </Button>
                  </>
                ) : (
                  <Button
                    asChild
                    className="h-10 w-full rounded-full bg-[#84CC16] text-neutral-950 hover:bg-[#73b512]"
                  >
                    <Link href="/shop" onClick={() => onOpenChange(false)}>
                      Shop & redeem
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ) : phase === 'pick' ? (
            <p className="relative mt-4 text-center text-xs text-neutral-500">
              {claiming
                ? 'Claiming your reward…'
                : 'One card hides your reward. Tap any card to reveal it.'}
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
