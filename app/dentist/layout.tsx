import type { Metadata } from 'next'
import { DentistPortalShell } from '@/components/dentist/dentist-portal-shell'

export const metadata: Metadata = {
  title: "Mark's Dental Clinic | Appointments",
  description: 'Manage patient appointment requests for Mark\'s Dental Clinic.',
}

export default function DentistLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DentistPortalShell>{children}</DentistPortalShell>
}
