import Link from 'next/link'
import { FooterWhatSetsUsApart } from '@/components/footer-trust-sections'

type SiteFooterProps = {
  showWhatSetsUsApart?: boolean
}

export function SiteFooter({ showWhatSetsUsApart = true }: SiteFooterProps) {
  return (
    <footer>
      {showWhatSetsUsApart ? <FooterWhatSetsUsApart /> : null}

      <div className="bg-neutral-950 text-white [&_a]:cursor-pointer">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
                  className="whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-950 transition-colors hover:bg-neutral-200"
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
              <h4 className="mb-4 font-semibold">Shop</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link href="#" className="transition-colors hover:text-white">All Products</Link></li>
                <li><Link href="#" className="transition-colors hover:text-white">Whitening</Link></li>
                <li><Link href="#" className="transition-colors hover:text-white">Toothpaste</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link href="#" className="transition-colors hover:text-white">About</Link></li>
                <li><Link href="#" className="transition-colors hover:text-white">Blog</Link></li>
                <li><Link href="/contact" className="transition-colors hover:text-white">Contact</Link></li>
                <li>
                  <Link href="/affiliate/register" className="transition-colors hover:text-white">
                    Become an affiliate
                  </Link>
                </li>
                <li>
                  <Link href="/affiliate" className="transition-colors hover:text-white">
                    Affiliate dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Support</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link href="#" className="transition-colors hover:text-white">FAQ</Link></li>
                <li><Link href="#" className="transition-colors hover:text-white">Shipping</Link></li>
                <li><Link href="#" className="transition-colors hover:text-white">Returns</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Follow</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>
                  <Link
                    href="https://www.instagram.com/gelosglobal/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-white"
                  >
                    Instagram
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://facebook.com/p/GELOS-61558412705085/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-white"
                  >
                    Facebook
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://www.tiktok.com/@gelosglobal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-white"
                  >
                    TikTok
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-800 py-8 text-center text-sm text-neutral-500">
            <p>&copy; 2026 Gelos. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
