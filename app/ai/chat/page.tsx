import type { Metadata } from 'next'
import { WellnessChatPage } from '@/components/gelos-ai/wellness-chat-page'

export const metadata: Metadata = {
  title: 'Wellness Expert Chat | Gelos AI',
  description:
    'Chat with the Gelos wellness expert for product advice, flavor picks, and personalized oral care tips.',
}

export default function GelosAiChatPage() {
  return <WellnessChatPage />
}
