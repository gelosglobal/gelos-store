import type { Metadata } from 'next'
import { HelpContentSections } from '@/components/help/help-content-sections'
import { HelpPageLayout } from '@/components/help/help-page-layout'
import { getStorePromotions } from '@/lib/db/store-settings'

export const metadata: Metadata = {
  title: 'Shipping & Delivery | Gelos',
  description:
    'Delivery areas, shipping fees, free shipping thresholds, and order tracking for Gelos orders in Ghana.',
}

export default async function ShippingPage() {
  const promotions = await getStorePromotions()

  const shippingSections = [
    {
      title: 'Delivery across Ghana',
      body: [
        'We deliver Gelos orders to addresses across Ghana. Enter your full delivery address at checkout to confirm availability for your area.',
        'Accra and major cities usually receive orders faster. Remote or hard-to-reach areas may take a little longer — we will keep you updated if there are delays.',
      ],
    },
    {
      title: 'Shipping fees',
      body: promotions.freeShippingEnabled
        ? [
            `Standard shipping is GH₵${promotions.shippingFee.toFixed(0)} per order.`,
            `Orders over GH₵${promotions.freeShippingThreshold.toFixed(0)} qualify for free shipping. The cart and checkout pages show your progress toward free shipping.`,
          ]
        : [
            `Standard shipping is GH₵${promotions.shippingFee.toFixed(0)} per order.`,
          ],
    },
    {
      title: 'Processing & delivery times',
      body: [
        'Orders are typically processed within 1–2 business days after payment is confirmed.',
        'Delivery usually takes 2–5 business days depending on your location and courier availability.',
        'You will receive an email confirmation when your order is placed. Contact us with your order number if you need a delivery update.',
      ],
    },
    {
      title: 'Order tracking',
      body: [
        'Include your order number when contacting support for tracking help.',
        'Make sure someone is available at the delivery address or provide clear directions and a reachable phone number for the courier.',
      ],
    },
    {
      title: 'Delivery issues',
      body: [
        'If your package arrives damaged or items are missing, contact us within 48 hours with photos and your order number.',
        'We will work with you on a replacement or refund where applicable.',
      ],
    },
  ]

  return (
    <HelpPageLayout
      currentHref="/shipping"
      title="Shipping & delivery"
      description="Everything you need to know about getting your Gelos order to your door."
    >
      <HelpContentSections sections={shippingSections} />
    </HelpPageLayout>
  )
}
