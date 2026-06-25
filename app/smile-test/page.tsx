import type { Metadata } from 'next'
import { SmileTestPage } from '@/components/smile-test/smile-test-page'

export const metadata: Metadata = {
  title: 'Smile Test | Gelos Smile AI',
  description:
    'Take the Gelos Smile Test and get a personalized oral care routine with product picks in under two minutes.',
}

export default function SmileTestRoutePage() {
  return <SmileTestPage />
}
