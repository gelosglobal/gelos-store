export function TrackResultsSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-[420px] rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-black/[0.04] sm:p-7"
      aria-hidden
    >
      <div className="flex items-center justify-between gap-3">
        <div className="h-7 w-20 rounded-full bg-neutral-100" />
        <div className="h-7 w-24 rounded-full bg-sky-50" />
      </div>
      <div className="mt-8 space-y-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="h-11 w-11 shrink-0 rounded-full bg-neutral-100" />
            <div className="min-w-0 flex-1 space-y-2 pt-1">
              <div className="h-4 w-28 rounded-md bg-neutral-100" />
              <div className="h-3 w-40 rounded-md bg-neutral-50" />
            </div>
            <div className="h-3 w-16 rounded-md bg-neutral-50" />
          </div>
        ))}
      </div>
      <div className="mt-8 h-12 rounded-full bg-emerald-50" />
    </div>
  )
}
