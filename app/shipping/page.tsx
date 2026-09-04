import type { Metadata } from 'next'
import { HelpContentSections } from '@/components/help/help-content-sections'
import { HelpPageLayout } from '@/components/help/help-page-layout'
import { getMarketSettings } from '@/lib/db/market-settings'

export const metadata: Metadata = {
  title: 'Shipping & Delivery | Gelos',
  description:
    'Delivery areas, shipping fees, free shipping thresholds, and order tracking for Gelos orders in Ghana and internationally.',
}

export default async function ShippingPage() {
  const ghana = await getMarketSettings('ghana')
  const fee = Math.max(0, Number(ghana.shippingFee) || 0)
  const threshold = Math.max(0, Number(ghana.freeShippingThreshold) || 0)

  const shippingFeeCopy =
    fee > 0
      ? `Standard shipping in Ghana is GH₵${fee.toFixed(0)} per order.`
      : 'Standard shipping in Ghana is calculated at checkout.'

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
      body: ghana.freeShippingEnabled
        ? [
            shippingFeeCopy,
            threshold > 0
              ? `Orders over GH₵${threshold.toFixed(0)} qualify for free shipping. The cart and checkout pages show your progress toward free shipping.`
              : 'Eligible orders may qualify for free shipping — check cart and checkout for details.',
          ]
        : [shippingFeeCopy],
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
      title: 'USA & international (DHL Express)',
      body: [
        'Orders to the USA and other international addresses ship with DHL Express from Accra. Checkout shows a live package rate and an estimated delivery date.',
        'When the shipment is created you receive a tracking number. Use Track order in the footer, or the link in your shipping email, to follow the major checkpoints — shipment pick up, left Ghana, arrived, out for delivery, and delivered.',
      ],
    },
    {
      title: 'Order tracking',
      body: [
        'DHL Express: use Track order in the footer, or the link in your shipping email.',
        'Ghana deliveries: include your order number when contacting support.',
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
