import { cn } from '@/lib/utils'

type MiniSparklineProps = {
  values: number[]
  className?: string
}

export function MiniSparkline({ values, className }: MiniSparklineProps) {
  const safe = values.length > 0 ? values : [0]
  const max = Math.max(...safe, 1)
  const width = 44
  const height = 18

  const points = safe
    .map((value, index) => {
      const x =
        safe.length === 1 ? width / 2 : (index / (safe.length - 1)) * width
      const y = height - 2 - (value / max) * (height - 4)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('shrink-0 text-neutral-400', className)}
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}
