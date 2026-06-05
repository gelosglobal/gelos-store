import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gelos AI | Smile Care Assistant',
  description:
    'Chat with Gelos AI, scan your smile for personalized tips, and book trusted partner dentists.',
}

export default function GelosAiLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
