import Image from 'next/image'
import { galleryImages } from '@/lib/gallery'

export function LifestyleGallery() {
  return (
    <section
      className="border-b border-border"
      aria-label="Gelos lifestyle gallery"
    >
      <div className="grid grid-cols-2 gap-0 md:grid-cols-5">
        {galleryImages.map((image, index) => (
          <div
            key={image.src}
            className="relative aspect-square overflow-hidden"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 50vw, 20vw"
              priority={index < 5}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
