import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { WhatsappOrderShareView } from '@/components/whatsapp-order-share-view'
import { getWhatsappOrder } from '@/lib/db/whatsapp-orders'
import { getAbsoluteAssetUrl } from '@/lib/storefront-url'
import { getAppUrl } from '@/lib/env'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ orderId: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { orderId } = await params
  const order = await getWhatsappOrder(orderId)

  if (!order) {
    return { title: 'Order not found | Gelos' }
  }

  const firstImage = order.payload.items[0]?.image
  const description = `${order.payload.items.length} items · Total ${order.payload.totalLabel}`

  return {
    title: `Gelos order · ${order.payload.items.length} items`,
    description,
    openGraph: {
      title: 'Gelos WhatsApp order',
      description,
      type: 'website',
      url: `${getAppUrl()}/whatsapp-order/${orderId}`,
      images: firstImage
        ? [
            {
              url: getAbsoluteAssetUrl(firstImage),
              alt: order.payload.items[0]?.name ?? 'Gelos product',
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Gelos WhatsApp order',
      description,
      images: firstImage ? [getAbsoluteAssetUrl(firstImage)] : undefined,
    },
  }
}

export default async function WhatsappOrderPage({ params }: PageProps) {
  const { orderId } = await params
  const order = await getWhatsappOrder(orderId)

  if (!order) {
    notFound()
  }

  return <WhatsappOrderShareView orderId={order.orderId} snapshot={order.payload} />
}
