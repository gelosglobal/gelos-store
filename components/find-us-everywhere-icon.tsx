'use client'

import { useEffect, useRef } from 'react'
import { MapPinCheckIcon, type MapPinCheckIconHandle } from '@/components/ui/map-pin-check'

const ANIMATION_LOOP_MS = 2500

export function FindUsEverywhereIcon() {
  const iconRef = useRef<MapPinCheckIconHandle>(null)

  useEffect(() => {
    const play = () => {
      void iconRef.current?.startAnimation()
    }

    play()
    const interval = window.setInterval(play, ANIMATION_LOOP_MS)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <MapPinCheckIcon
      ref={iconRef}
      size={22}
      className="shrink-0 text-neutral-950"
      aria-hidden
    />
  )
}
