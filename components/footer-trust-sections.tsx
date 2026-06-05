import {
  Droplet,
  FlaskConical,
  Globe2,
  Leaf,
  Package,
  Wheat,
} from 'lucide-react'
import type { ReactNode } from 'react'

function SlashOverlay() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-10 size-full text-neutral-900"
      viewBox="0 0 64 64"
      aria-hidden
    >
      <line
        x1="12"
        y1="52"
        x2="52"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function FeatureCircle({
  children,
  slashed = false,
}: {
  children: ReactNode
  slashed?: boolean
}) {
  return (
    <div className="relative mx-auto flex size-14 items-center justify-center rounded-full border border-neutral-900 sm:size-16">
      <span className="relative z-0">{children}</span>
      {slashed ? <SlashOverlay /> : null}
    </div>
  )
}

function BunnyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <ellipse cx="8.5" cy="7" rx="2" ry="4.5" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <ellipse cx="15.5" cy="7" rx="2" ry="4.5" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="12" cy="14" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="10" cy="14" r="0.75" fill="currentColor" />
      <circle cx="14" cy="14" r="0.75" fill="currentColor" />
    </svg>
  )
}

function MoleculeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <circle cx="6" cy="12" r="2" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="18" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="18" cy="16" r="2" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path d="M8 11l8-2M8 13l8 2" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  )
}

function PeroxideIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <rect x="8" y="6" width="8" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path d="M10 6V4.5A2 2 0 0 1 14 4.5V6" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <text x="12" y="15" textAnchor="middle" fontSize="5" fontWeight="700" fill="currentColor">
        H₂O₂
      </text>
    </svg>
  )
}

const features = [
  {
    label: 'Vegan',
    icon: <Leaf className="size-6" strokeWidth={1.25} />,
  },
  {
    label: 'Cruelty-free',
    slashed: true,
    icon: <BunnyIcon />,
  },
  {
    label: 'Paraben-free',
    slashed: true,
    icon: <MoleculeIcon />,
  },
  {
    label: 'Triclosan free',
    slashed: true,
    icon: <Droplet className="size-6" strokeWidth={1.25} />,
  },
  {
    label: 'SLS free',
    slashed: true,
    icon: <FlaskConical className="size-6" strokeWidth={1.25} />,
  },
  {
    label: 'Gluten free',
    slashed: true,
    icon: <Wheat className="size-6" strokeWidth={1.25} />,
  },
  {
    label: 'Peroxide free',
    slashed: true,
    icon: <PeroxideIcon />,
  },
  {
    label: 'Ethical Sourcing',
    icon: (
      <span className="relative">
        <Globe2 className="size-6" strokeWidth={1.25} />
        <Leaf className="absolute -bottom-1 -right-2 size-3" strokeWidth={1.5} />
      </span>
    ),
  },
  {
    label: 'GMO free',
    slashed: true,
    icon: (
      <span className="text-[10px] font-bold tracking-tight">GMO</span>
    ),
  },
  {
    label: 'Thoughtful Packaging',
    icon: (
      <span className="relative">
        <Package className="size-6" strokeWidth={1.25} />
        <Leaf className="absolute -top-1 right-0 size-3" strokeWidth={1.5} />
      </span>
    ),
  },
] as const

export function FooterWhatSetsUsApart() {
  return (
    <section
      aria-labelledby="footer-features-heading"
      className="border-b border-neutral-200 bg-white py-8 md:py-10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2
          id="footer-features-heading"
          className="text-center font-serif text-2xl font-medium tracking-tight text-neutral-950 md:text-3xl"
        >
          What Sets Us Apart
        </h2>

        <ul className="mt-8 grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-5 md:grid-cols-5 md:gap-x-6 lg:max-w-4xl lg:mx-auto">
          {features.map((feature) => (
            <li key={feature.label} className="text-center">
              <FeatureCircle slashed={'slashed' in feature && feature.slashed}>
                {feature.icon}
              </FeatureCircle>
              <p className="mt-3 text-[11px] font-semibold leading-tight text-neutral-950 sm:text-xs">
                {feature.label}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
