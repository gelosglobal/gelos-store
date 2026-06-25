'use client'

import { useId } from 'react'

export function SmileScoreGauge({ score }: { score: number }) {
  const gradientId = useId()
  const pct = Math.min(100, Math.max(0, score))
  const radius = 54
  const circumference = Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="relative mx-auto h-36 w-full max-w-[220px]">
      <svg viewBox="0 0 140 80" className="h-full w-full" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F43F5E" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#84CC16" />
          </linearGradient>
        </defs>
        <path
          d="M 14 70 A 56 56 0 0 1 126 70"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M 14 70 A 56 56 0 0 1 126 70"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="text-4xl font-bold text-neutral-950">{score}</p>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">/ 100</p>
      </div>
    </div>
  )
}
