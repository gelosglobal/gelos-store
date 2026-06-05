'use client'

import Link from 'next/link'
import { BestSellers } from '@/components/best-sellers'
import { FeaturedProductsHero } from '@/components/featured-products-hero'
import { LifestyleGallery } from '@/components/lifestyle-gallery'
import { ShopByCollection } from '@/components/shop-by-collection'
import { StockistsMarquee } from '@/components/stockists-marquee'

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <FeaturedProductsHero />

      <StockistsMarquee />

      <BestSellers />

      <ShopByCollection className="bg-muted/20" />

      <LifestyleGallery />

      {/* Ingredient Highlight Section — hidden
      <section className="py-20 bg-muted/20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Natural Ingredients', description: 'Made from pure, sustainably sourced natural ingredients. No harmful chemicals, just nature\'s best.' },
              { title: 'Dentist Approved', description: 'Formulated in collaboration with dental professionals and recommended by leading dentists worldwide.' },
              { title: 'Eco-Friendly', description: 'Our packaging is 100% recyclable and biodegradable. We care for your smile and our planet.' }
            ].map((item, idx) => (
              <div key={idx} className="group p-8 rounded-lg hover:bg-background transition-colors">
                <div className="text-4xl mb-4 text-secondary/40 group-hover:text-secondary transition-colors">◆</div>
                <h3 className="font-serif text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      */}

      {/* Interactive Benefits Section — hidden
      <section className="py-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold mb-4">Why Choose Gelos?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Transform your oral care routine with science-backed products designed for visible results</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {[
                { icon: '✨', title: 'Visible Whitening', desc: 'See results in as little as 7 days' },
                { icon: '🛡️', title: 'Advanced Protection', desc: 'Guard against decay and sensitivity' },
                { icon: '🌿', title: 'Fresh Breath', desc: 'Long-lasting minty freshness all day' },
                { icon: '💪', title: 'Enamel Strength', desc: 'Strengthen and protect your enamel' }
              ].map((benefit, idx) => (
                <div key={idx} className="flex gap-4 group cursor-pointer">
                  <div className="text-3xl flex-shrink-0">{benefit.icon}</div>
                  <div className="flex-grow">
                    <h4 className="font-semibold text-lg group-hover:text-secondary transition-colors">{benefit.title}</h4>
                    <p className="text-muted-foreground text-sm">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="h-96 bg-gradient-to-br from-muted to-secondary/10 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <div className="text-7xl mb-4">🦷</div>
                <p className="text-muted-foreground">Premium Smile Care</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      */}

      {/* Testimonials & Transformation Stories */}
      {/* <section className="py-20 bg-secondary/5 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold mb-4">Real Results from Real People</h2>
            <p className="text-lg text-muted-foreground">Join thousands of customers who have transformed their smiles with Gelos</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Mitchell',
                role: 'Beauty Influencer',
                image: '👩‍🦰',
                text: 'I\'ve tried every whitening product on the market. Gelos is the first one that delivered results I could actually see. My smile is noticeably brighter in just two weeks!',
                rating: 5
              },
              {
                name: 'James Chen',
                role: 'Dental Professional',
                image: '👨‍⚕️',
                text: 'As a dentist, I recommend only products I trust. Gelos combines effectiveness with safety. My patients love the results and the natural ingredients.',
                rating: 5
              },
              {
                name: 'Emma Rodriguez',
                role: 'Busy Professional',
                image: '👩‍💼',
                text: 'Easy to use, works fast, and I love that it\'s eco-friendly. Gelos fits perfectly into my lifestyle and my smile has never looked better.',
                rating: 5
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-background border border-border rounded-xl p-8 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-5xl">{testimonial.image}</div>
                  <div>
                    <h4 className="font-semibold text-lg">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
                <div className="flex gap-1">
                  {Array(testimonial.rating).fill(0).map((_, i) => (
                    <span key={i} className="text-accent">★</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Comparison Section — Why Gelos Stands Out (hidden)
      <section className="py-20 bg-muted/20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold mb-4">Why Gelos Stands Out</h2>
            <p className="text-lg text-muted-foreground">Compare us to traditional dental care</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold text-secondary">Gelos</th>
                  <th className="text-center py-4 px-4 font-semibold text-muted-foreground">Traditional Brands</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Natural Ingredients', gelos: true, traditional: false },
                  { feature: 'Eco-Friendly Packaging', gelos: true, traditional: false },
                  { feature: 'Dentist Approved', gelos: true, traditional: false },
                  { feature: 'Visible Results (7 days)', gelos: true, traditional: false },
                  { feature: 'Affordable Pricing', gelos: true, traditional: false },
                  { feature: 'Harsh Chemicals', gelos: false, traditional: true }
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-background/50 transition-colors">
                    <td className="py-4 px-4 font-medium">{row.feature}</td>
                    <td className="py-4 px-4 text-center">
                      {row.gelos ? <span className="text-green-600 font-bold text-lg">✓</span> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.traditional ? <span className="text-red-600 font-bold text-lg">✗</span> : <span className="text-green-600 font-bold text-lg">✓</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      */}

      {/* Smile Science & Tips — hidden
      <section className="py-20 border-b border-border">
        ...
      </section>
      */}

      {/* Footer */}
      <footer className="bg-neutral-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-neutral-800 py-10 md:py-12">
            <div className="mx-auto max-w-xl text-center md:max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Get Exclusive Offers
              </h2>
              <p className="mt-3 text-sm text-neutral-400 md:text-base">
                Subscribe for 15% off your first order and tips from our dental experts.
              </p>
              <form
                className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  aria-label="Email address"
                  className="min-w-0 flex-1 rounded-full border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white sm:max-w-xs"
                />
                <button
                  type="submit"
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-950 transition-colors hover:bg-neutral-200 whitespace-nowrap"
                >
                  Subscribe
                </button>
              </form>
              <p className="mt-3 text-xs text-neutral-500">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link href="#" className="hover:text-white transition-colors">All Products</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Whitening</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Toothpaste</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link href="#" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Shipping</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Returns</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Follow</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link href="#" className="hover:text-white transition-colors">Instagram</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Twitter</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">TikTok</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-800 py-8 text-center text-sm text-neutral-500">
            <p>&copy; 2025 Gelos. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
