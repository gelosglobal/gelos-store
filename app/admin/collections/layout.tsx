import { CollectionsNav } from '@/components/admin/collections-nav'

export default function AdminCollectionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <CollectionsNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
