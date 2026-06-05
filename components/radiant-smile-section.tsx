import { SplitLifestyleSection } from '@/components/split-lifestyle-section'

const fairImage = {
  src: '/gelos/gelos-fair.jpg',
  alt: 'Person enjoying Gelos strawberry toothpaste',
}

export function RadiantSmileSection() {
  return (
    <>
      <SplitLifestyleSection
        id="bundles-heading"
        imageSrc="/gelos/GELOS1530.jpg"
        imageAlt="Friends smiling with Gelos toothpaste bundles"
        imagePosition="left"
        heading="Build your perfect smile bundle."
        description="Mix and match Gelos favorites — flavored toothpastes, mouthwashes, and whitening picks — into one routine that fits your smile goals and saves you more."
        ctaHref="/shop?bundles=true"
        ctaLabel="Shop bundles"
      />

      {/* <SplitLifestyleSection
        id="radiant-smile-heading"
        imageSrc={fairImage.src}
        imageAlt={fairImage.alt}
        imagePosition="right"
        heading="Toothpaste they'll actually look forward to using."
        description="Gelos flavored toothpastes make daily brushing feel fresh and fun — with bold fruit-inspired flavors and dentist-trusted care in every squeeze."
        ctaHref="/shop?category=Toothpaste"
      /> */}
    </>
  )
}
