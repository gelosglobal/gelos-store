import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FlavorCollectionPage } from '@/components/flavor-collection-page'
import { flavors, getFlavorBySlug } from '@/lib/flavors'

type PageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return flavors.map((flavor) => ({ slug: flavor.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const flavor = getFlavorBySlug(slug)

  if (!flavor) {
    return { title: 'Flavour not found | Gelos' }
  }

  return {
    title: `${flavor.label} | Gelos Flavours`,
    description: flavor.description,
  }
}

export default async function FlavorCollectionRoute({ params }: PageProps) {
  const { slug } = await params
  const flavor = getFlavorBySlug(slug)

  if (!flavor) {
    notFound()
  }

  return <FlavorCollectionPage slug={slug} />
}
