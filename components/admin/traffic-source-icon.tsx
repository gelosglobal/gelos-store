'use client'

import Image from 'next/image'
import {
  CircleHelp,
  Globe2,
  HandCoins,
  Leaf,
  Link2,
  Mail,
  MousePointerClick,
  Share2,
} from 'lucide-react'
import type { TrafficChannel, TrafficType } from '@/lib/traffic-attribution'
import { cn } from '@/lib/utils'

const CHANNEL_LOGOS: Partial<Record<TrafficChannel, string>> = {
  facebook: '/gelos/pay-logo/facebook.png',
  instagram: '/gelos/pay-logo/instagram.png',
  tiktok: '/gelos/pay-logo/tik-tok.png',
}

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M5.3 14.3l-.8.6-2.5 1.9C3.5 20 7.5 22.5 12 22.5c2.7 0 5-.9 6.7-2.4l-3.1-2.4c-.9.6-2 .9-3.6.9-2.8 0-5.1-1.9-5.9-4.4z"
      />
      <path
        fill="#4A90E2"
        d="M3.9 7.2C3.3 8.4 3 9.7 3 11.1c0 1.4.3 2.7.9 3.9l3.3-2.5c-.2-.6-.3-1.2-.3-1.9 0-.6.1-1.2.3-1.8z"
      />
      <path
        fill="#FBBC05"
        d="M12 4.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 1.9 14.7 1 12 1 7.5 1 3.5 3.5 1.9 7.2l3.3 2.5C6.9 6.8 9.2 4.9 12 4.9z"
      />
    </svg>
  )
}

function YouTubeGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#FF0000"
        d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8z"
      />
      <path fill="#fff" d="M9.8 15.5V8.5L15.7 12z" />
    </svg>
  )
}

function XGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M18.9 2H22l-6.8 7.8L23 22h-6.3l-4.9-6.4L6.1 22H3l7.3-8.3L1 2h6.5l4.4 5.8L18.9 2zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20z"
      />
    </svg>
  )
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#25D366"
        d="M12 2a9.9 9.9 0 0 0-8.5 14.9L2 22l5.3-1.4A9.9 9.9 0 1 0 12 2zm0 18a8.1 8.1 0 0 1-4.1-1.1l-.3-.2-3.1.8.8-3-.2-.3A8.1 8.1 0 1 1 12 20zm4.5-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.7.9-.1.2-.3.2-.5.1-.2-.1-.9-.3-1.8-1.1-.7-.6-1.1-1.3-1.3-1.5-.1-.2 0-.3.1-.4.1-.1.2-.3.3-.4.1-.1.1-.2.2-.4 0-.1 0-.3-.1-.4-.1-.1-.5-1.3-.7-1.8-.2-.4-.4-.4-.5-.4h-.4c-.1 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.3c.1.2 1.6 2.5 3.9 3.5 2.3 1 2.3.7 2.7.6.4-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1-.1-.2-.2-.4-.3z"
      />
    </svg>
  )
}

type TrafficSourceIconProps = {
  channel?: TrafficChannel | string
  trafficType?: TrafficType | string
  className?: string
  size?: number
}

export function TrafficSourceIcon({
  channel,
  trafficType,
  className,
  size = 18,
}: TrafficSourceIconProps) {
  const box = cn(
    'inline-flex shrink-0 items-center justify-center rounded-md bg-white ring-1 ring-neutral-200/80',
    className,
  )
  const style = { width: size + 10, height: size + 10 }

  if (channel) {
    const logo = CHANNEL_LOGOS[channel as TrafficChannel]
    if (logo) {
      return (
        <span className={box} style={style}>
          <Image
            src={logo}
            alt=""
            width={size}
            height={size}
            className="object-contain"
          />
        </span>
      )
    }

    if (channel === 'google') {
      return (
        <span className={box} style={style}>
          <GoogleGlyph className="h-[70%] w-[70%]" />
        </span>
      )
    }
    if (channel === 'youtube') {
      return (
        <span className={box} style={style}>
          <YouTubeGlyph className="h-[70%] w-[70%]" />
        </span>
      )
    }
    if (channel === 'twitter') {
      return (
        <span className={cn(box, 'text-neutral-950')} style={style}>
          <XGlyph className="h-[55%] w-[55%]" />
        </span>
      )
    }
    if (channel === 'whatsapp') {
      return (
        <span className={box} style={style}>
          <WhatsAppGlyph className="h-[70%] w-[70%]" />
        </span>
      )
    }
    if (channel === 'email') {
      return (
        <span className={cn(box, 'text-sky-600')} style={style}>
          <Mail className="h-[55%] w-[55%]" />
        </span>
      )
    }
    if (channel === 'affiliate') {
      return (
        <span className={cn(box, 'text-violet-600')} style={style}>
          <Share2 className="h-[55%] w-[55%]" />
        </span>
      )
    }
    if (channel === 'direct') {
      return (
        <span className={cn(box, 'text-neutral-700')} style={style}>
          <MousePointerClick className="h-[55%] w-[55%]" />
        </span>
      )
    }
    if (channel === 'other') {
      return (
        <span className={cn(box, 'text-neutral-600')} style={style}>
          <Globe2 className="h-[55%] w-[55%]" />
        </span>
      )
    }
  }

  if (trafficType === 'paid') {
    return (
      <span className={cn(box, 'text-amber-600')} style={style}>
        <HandCoins className="h-[55%] w-[55%]" />
      </span>
    )
  }
  if (trafficType === 'organic') {
    return (
      <span className={cn(box, 'text-emerald-600')} style={style}>
        <Leaf className="h-[55%] w-[55%]" />
      </span>
    )
  }
  if (trafficType === 'direct') {
    return (
      <span className={cn(box, 'text-neutral-700')} style={style}>
        <MousePointerClick className="h-[55%] w-[55%]" />
      </span>
    )
  }
  if (trafficType === 'unknown') {
    return (
      <span className={cn(box, 'text-neutral-500')} style={style}>
        <CircleHelp className="h-[55%] w-[55%]" />
      </span>
    )
  }

  return (
    <span className={cn(box, 'text-neutral-500')} style={style}>
      <Link2 className="h-[55%] w-[55%]" />
    </span>
  )
}
