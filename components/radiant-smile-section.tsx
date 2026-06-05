import { SplitLifestyleSection } from '@/components/split-lifestyle-section'

const fairImage = {
  src: '/gelos/gelos-fair.jpg',
  alt: 'Person enjoying Gelos strawberry toothpaste',
}

export function RadiantSmileSection() {
  return (
    <>
      <SplitLifestyleSection
        id="radiant-smile-heading"
        imageSrc={fairImage.src}
        imageAlt={fairImage.alt}
        imagePosition="right"
        heading="Toothpaste they'll actually look forward to using."
        description="Gelos flavored toothpastes make daily brushing feel fresh and fun — with bold fruit-inspired flavors and dentist-trusted care in every squeeze."
        ctaHref="/shop?category=Toothpaste"
      />

      <SplitLifestyleSection
        id="water-flosser-heading"
        imageSrc="/gelos/GELOS1674.jpg"
        imageAlt="Person using the Gelos portable water flosser"
        imagePosition="left"
        heading="A deeper clean between every tooth."
        description="The Gelos water flosser gently removes plaque and debris where brushing can't reach — for fresher gums and a cleaner smile in minutes."
        ctaHref="/shop?category=Accessories"
      />
    </>
  )
}
