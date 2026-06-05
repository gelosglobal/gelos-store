import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type SplitLifestyleSectionProps = {
  id: string
  imageSrc: string
  imageAlt: string
  heading: string
  description: string
  ctaHref?: string
  ctaLabel?: string
  imagePosition?: 'left' | 'right'
  className?: string
}

export function SplitLifestyleSection({
  id,
  imageSrc,
  imageAlt,
  heading,
  description,
  ctaHref = '/shop',
  ctaLabel = 'Shop now',
  imagePosition = 'left',
  className,
}: SplitLifestyleSectionProps) {
  const imageOnRight = imagePosition === 'right'

  return (
    <section
      aria-labelledby={id}
      className={cn(
        'border-b border-border bg-[#faf9f7] py-12 md:py-16 lg:py-20',
        className,
      )}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 md:grid-cols-2 md:gap-12 lg:gap-16 lg:px-8">
        <div
          className={cn(
            'relative aspect-[4/5] w-full max-w-lg justify-self-center overflow-hidden rounded-[1.75rem] md:max-w-none lg:rounded-[2rem]',
            imageOnRight
              ? 'md:order-2 md:justify-self-end'
              : 'md:order-1 md:justify-self-start',
          )}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 90vw, 50vw"
          />
        </div>

        <div
          className={cn(
            'max-w-xl md:py-4',
            imageOnRight ? 'md:order-1' : 'md:order-2',
          )}
        >
          <h2
            id={id}
            className="text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]"
          >
            {heading}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
            {description}
          </p>
          <Link
            href={ctaHref}
            className="mt-8 inline-flex rounded-full bg-neutral-950 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 sm:mt-10 sm:px-10 sm:text-base"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  )
}
