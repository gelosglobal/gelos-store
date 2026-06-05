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
    <span
      className="pointer-events-none absolute inset-[18%] rotate-45 border-t border-neutral-900"
      aria-hidden
    />
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
      {children}
      {slashed ? <SlashOverlay /> : null}
    </div>
  )
}

function ToothIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <path
        d="M12 3c-2.5 0-4.5 1.2-5.5 3.2-.8 1.5-1 3.4-.8 5.2.2 1.8.8 3.5 1.5 4.8.5.9 1.1 1.5 1.8 1.5.6 0 1-.4 1.3-1.1.3-.8.5-2 .5-3.4 0-1.2.2-2.1.5-2.7.3-.5.7-.8 1.2-.8s.9.3 1.2.8c.3.6.5 1.5.5 2.7 0 1.4.2 2.6.5 3.4.3.7.7 1.1 1.3 1.1.7 0 1.3-.6 1.8-1.5.7-1.3 1.3-3 1.5-4.8.2-1.8 0-3.7-.8-5.2C16.5 4.2 14.5 3 12 3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
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

function SeaweedIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <path
        d="M12 20V8M9 20c0-4 1-7 3-9M15 20c0-4-1-7-3-9M7 20c1-5 2.5-8 5-10M17 20c-1-5-2.5-8-5-10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
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
    label: 'Fluoride free',
    slashed: true,
    icon: <ToothIcon />,
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
    label: 'Carrageenan free',
    slashed: true,
    icon: <SeaweedIcon />,
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

        <ul className="mt-8 grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-6 md:gap-x-6">
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
