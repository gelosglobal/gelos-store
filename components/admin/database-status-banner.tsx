import { AlertCircle } from 'lucide-react'

type DatabaseStatusBannerProps = {
  connected: boolean
}

export function DatabaseStatusBanner({ connected }: DatabaseStatusBannerProps) {
  if (connected) {
    return null
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        <strong>Preview mode</strong> — showing mock catalog. Connect{' '}
        <code className="rounded bg-amber-100 px-1">DATABASE_URL</code>, then run{' '}
        <code className="rounded bg-amber-100 px-1">pnpm db:push</code> and{' '}
        <code className="rounded bg-amber-100 px-1">pnpm db:seed</code> to enable
        saving edits.
      </span>
    </div>
  )
}
