'use client'

import { useEffect, useRef, type ForwardRefExoticComponent, type HTMLAttributes, type RefAttributes } from 'react'
import { AtomIcon, type AtomIconHandle } from '@/components/ui/atom'
import { RabbitIcon, type RabbitIconHandle } from '@/components/ui/rabbit'
import { ShieldCheckIcon, type ShieldCheckIconHandle } from '@/components/ui/shield-check'
import { TruckIcon, type TruckIconHandle } from '@/components/ui/truck'
import { trustStats, type TrustStat, type TrustStatIcon } from '@/lib/trust-stats'
import { cn } from '@/lib/utils'

type AnimatedIconHandle = ShieldCheckIconHandle | AtomIconHandle | TruckIconHandle | RabbitIconHandle

const statIcons: Record<
  TrustStatIcon,
  ForwardRefExoticComponent<
    HTMLAttributes<HTMLDivElement> & { size?: number } & RefAttributes<AnimatedIconHandle>
  >
> = {
  'shield-check': ShieldCheckIcon,
  atom: AtomIcon,
  truck: TruckIcon,
  rabbit: RabbitIcon,
}

const ANIMATION_LOOP_MS = 2500

type TrustStatsBarProps = {
  className?: string
}

function TrustStatItem({ stat, index }: { stat: TrustStat; index: number }) {
  const iconRef = useRef<AnimatedIconHandle>(null)
  const Icon = statIcons[stat.icon]

  useEffect(() => {
    const initialDelay = index * 400
    let intervalId: number | undefined

    const timeoutId = window.setTimeout(() => {
      const play = () => {
        void iconRef.current?.startAnimation()
      }

      play()
      intervalId = window.setInterval(play, ANIMATION_LOOP_MS)
    }, initialDelay)

    return () => {
      window.clearTimeout(timeoutId)
      if (intervalId !== undefined) {
        window.clearInterval(intervalId)
      }
    }
  }, [index])

  return (
    <div className="flex min-w-[8.5rem] max-w-[12rem] items-center gap-2.5 py-3 pl-0 pr-3 sm:min-w-[9.5rem] sm:max-w-none sm:py-3.5 sm:pr-4">
      <Icon
        ref={iconRef}
        size={24}
        className="shrink-0 text-neutral-950"
        aria-hidden
      />
      <span className="text-xs font-semibold leading-snug text-neutral-950 sm:text-sm">
        {stat.label}
      </span>
    </div>
  )
}

export function TrustStatsBar({ className }: TrustStatsBarProps) {
  return (
    <div
      className={cn(
        'inline-flex max-w-full items-stretch overflow-x-auto bg-white',
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {trustStats.map((stat, index) => (
        <TrustStatItem key={stat.id} stat={stat} index={index} />
      ))}
    </div>
  )
}
