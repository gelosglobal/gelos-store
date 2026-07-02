'use client'

import Link from 'next/link'
import { UserRoundPen } from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

type StorefrontAdminLinkProps = {
  className?: string
  onNavigate?: () => void
  showLabel?: boolean
}

export function StorefrontAdminLink({
  className,
  onNavigate,
  showLabel = false,
}: StorefrontAdminLinkProps) {
  const { data: session, isPending } = useSession()
  const role = (session?.user as { role?: string } | undefined)?.role

  if (isPending || role !== 'admin') {
    return null
  }

  return (
    <Link
      href="/admin"
      onClick={onNavigate}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg p-2 text-foreground transition-colors hover:bg-neutral-100 hover:text-foreground',
        className,
      )}
      aria-label="Open admin dashboard"
      title="Admin dashboard"
    >
      <UserRoundPen className="h-5 w-5 shrink-0" strokeWidth={1.75} />
      {showLabel ? (
        <span className="text-sm font-semibold">Admin</span>
      ) : null}
    </Link>
  )
}
