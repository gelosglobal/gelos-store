import { SharedSmileReportView } from '@/components/gelos-ai/shared-smile-report-view'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ scanId: string }>
}

export default async function SharedSmileReportPage({ params }: PageProps) {
  const { scanId } = await params
  return <SharedSmileReportView scanId={scanId} />
}
