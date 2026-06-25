'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { ScanTextIcon, type ScanTextIconHandle } from '@/components/ui/scan-text'

const ANIMATION_LOOP_MS = 2200

export function HeroSmileQuizButton() {
  const iconRef = useRef<ScanTextIconHandle>(null)

  useEffect(() => {
    const play = () => {
      void iconRef.current?.startAnimation()
    }

    play()
    const interval = window.setInterval(play, ANIMATION_LOOP_MS)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <Link
      href="/smile-test"
      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/20"
    >
      <ScanTextIcon ref={iconRef} size={20} className="shrink-0 text-current" aria-hidden />
      Take smile test
    </Link>
  )
}
