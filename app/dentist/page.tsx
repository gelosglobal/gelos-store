'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react'
import { AppointmentStatusBadge } from '@/components/dentist/appointment-status-badge'
import { DentistStatCard } from '@/components/dentist/dentist-stat-card'
import { CLINIC_HOURS_LABEL } from '@/lib/gelos-ai/dentist-schedule'
import type {
  AppointmentStatus,
  DentistAppointmentRecord,
  DentistAppointmentStats,
} from '@/lib/dentist/appointment-types'
import { APPOINTMENT_STATUSES } from '@/lib/dentist/appointment-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

type TabFilter = 'all' | AppointmentStatus

type PortalPayload = {
  dentist: { id: string; name: string; clinic: string }
  appointments: DentistAppointmentRecord[]
  stats: DentistAppointmentStats
}

const emptyStats: DentistAppointmentStats = {
  pending: 0,
  confirmed: 0,
  completed: 0,
  cancelled: 0,
  today: 0,
}

function formatDateLabel(value: string): string {
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatRequestedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function isToday(dateValue: string): boolean {
  return dateValue === new Date().toISOString().slice(0, 10)
}

function AppointmentCard({
  appointment,
  updating,
  onStatusChange,
}: {
  appointment: DentistAppointmentRecord
  updating: boolean
  onStatusChange: (status: AppointmentStatus) => void
}) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-neutral-950">{appointment.patientName}</p>
          <p className="mt-0.5 text-xs text-neutral-500">{appointment.appointmentId}</p>
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </div>

      <div className="mt-3 grid gap-2 text-sm text-neutral-700 sm:grid-cols-2">
        <p>
          <span className="text-neutral-500">Date:</span>{' '}
          {formatDateLabel(appointment.preferredDate)} · {appointment.preferredTime}
        </p>
        <p>
          <span className="text-neutral-500">Requested:</span>{' '}
          {formatRequestedAt(appointment.createdAt)}
        </p>
      </div>

      {appointment.reason ? (
        <p className="mt-3 text-sm text-neutral-600">{appointment.reason}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="outline" className="rounded-full">
          <a href={`tel:${appointment.patientPhone.replace(/\s/g, '')}`}>
            <Phone className="h-3.5 w-3.5" />
            Call
          </a>
        </Button>
        <Button asChild size="sm" variant="outline" className="rounded-full">
          <a href={`mailto:${appointment.patientEmail}`}>
            <Mail className="h-3.5 w-3.5" />
            Email
          </a>
        </Button>
        {appointment.status === 'pending' ? (
          <Button
            type="button"
            size="sm"
            className="rounded-full bg-sky-600 hover:bg-sky-700"
            disabled={updating}
            onClick={() => onStatusChange('confirmed')}
          >
            Confirm
          </Button>
        ) : null}
        <Select
          value={appointment.status}
          onValueChange={(value) => onStatusChange(value as AppointmentStatus)}
          disabled={updating}
        >
          <SelectTrigger className="h-8 w-[130px] rounded-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {APPOINTMENT_STATUSES.map((status) => (
              <SelectItem key={status} value={status} className="capitalize">
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default function DentistDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<PortalPayload | null>(null)
  const [tab, setTab] = useState<TabFilter>('all')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    try {
      const sessionRes = await fetch('/api/dentist/auth/session', { cache: 'no-store' })
      const session = (await sessionRes.json()) as {
        authenticated: boolean
        configured: boolean
      }

      if (!session.configured || !session.authenticated) {
        router.replace('/dentist/login')
        return
      }

      const statusQuery = tab === 'all' ? '' : `?status=${tab}`
      const res = await fetch(`/api/dentist/appointments${statusQuery}`, {
        cache: 'no-store',
      })
      const json = (await res.json()) as PortalPayload & { error?: string }

      if (!res.ok) {
        throw new Error(json.error ?? 'Failed to load appointments.')
      }

      setData(json)
    } catch {
      router.replace('/dentist/login')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [router, tab])

  useEffect(() => {
    void load()
  }, [load])

  const filteredAppointments = useMemo(() => {
    const appointments = data?.appointments ?? []
    const query = search.trim().toLowerCase()
    if (!query) return appointments

    return appointments.filter((appointment) =>
      [
        appointment.appointmentId,
        appointment.patientName,
        appointment.patientEmail,
        appointment.patientPhone,
        appointment.reason,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [data?.appointments, search])

  const todayAppointments = useMemo(
    () =>
      filteredAppointments.filter(
        (appointment) =>
          isToday(appointment.preferredDate) &&
          (appointment.status === 'pending' || appointment.status === 'confirmed'),
      ),
    [filteredAppointments],
  )

  const updateStatus = async (
    appointmentId: string,
    status: AppointmentStatus,
  ) => {
    setUpdatingId(appointmentId)
    try {
      const res = await fetch(`/api/dentist/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) throw new Error('Update failed')
      await load(true)
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-sky-100 bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    )
  }

  const stats = data?.stats ?? emptyStats

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-600 to-sky-700 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-sky-100">Welcome back</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Appointment desk
            </h1>
            <p className="mt-2 text-sm text-sky-100">{CLINIC_HOURS_LABEL}</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="rounded-full bg-white text-sky-700 hover:bg-sky-50"
            onClick={() => void load(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
        {stats.pending > 0 ? (
          <p className="mt-4 rounded-xl bg-white/15 px-4 py-2 text-sm">
            {stats.pending} request{stats.pending === 1 ? '' : 's'} waiting for your review.
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <DentistStatCard
          label="Pending"
          value={stats.pending}
          hint="Needs review"
          icon={CalendarClock}
          accent="amber"
        />
        <DentistStatCard
          label="Confirmed"
          value={stats.confirmed}
          hint="Scheduled"
          icon={CalendarCheck}
          accent="blue"
        />
        <DentistStatCard
          label="Today"
          value={stats.today}
          hint="Due today"
          icon={CalendarDays}
          accent="blue"
        />
        <DentistStatCard
          label="Completed"
          value={stats.completed}
          hint="Seen patients"
          icon={CheckCircle2}
          accent="green"
        />
        <DentistStatCard
          label="Cancelled"
          value={stats.cancelled}
          hint="Closed"
          icon={XCircle}
          accent="rose"
        />
      </div>

      {todayAppointments.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-950">Today&apos;s schedule</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {todayAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.appointmentId}
                appointment={appointment}
                updating={updatingId === appointment.appointmentId}
                onStatusChange={(status) =>
                  void updateStatus(appointment.appointmentId, status)
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-sky-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-sky-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-950">All requests</h2>
            <p className="text-sm text-neutral-500">Search, filter, and update appointment status.</p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patients…"
              className="rounded-full border-sky-100 pl-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-sky-50 px-4 py-3">
          {(['all', ...APPOINTMENT_STATUSES] as TabFilter[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-colors',
                tab === value
                  ? 'bg-sky-600 text-white'
                  : 'bg-sky-50 text-sky-800 hover:bg-sky-100',
              )}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="space-y-3 p-4 lg:hidden">
          {filteredAppointments.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-500">
              No appointments in this view yet.
            </p>
          ) : (
            filteredAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.appointmentId}
                appointment={appointment}
                updating={updatingId === appointment.appointmentId}
                onStatusChange={(status) =>
                  void updateStatus(appointment.appointmentId, status)
                }
              />
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Preferred slot</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-neutral-500">
                    No appointments in this view yet.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.appointmentId}>
                    <TableCell>
                      <p className="font-medium">{appointment.appointmentId}</p>
                      <p className="text-xs text-neutral-500">
                        {formatRequestedAt(appointment.createdAt)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-neutral-950">{appointment.patientName}</p>
                      <div className="mt-1 flex flex-col gap-1 text-xs">
                        <a
                          href={`mailto:${appointment.patientEmail}`}
                          className="inline-flex items-center gap-1 text-sky-700 hover:underline"
                        >
                          <Mail className="h-3 w-3" />
                          {appointment.patientEmail}
                        </a>
                        <a
                          href={`tel:${appointment.patientPhone.replace(/\s/g, '')}`}
                          className="inline-flex items-center gap-1 text-sky-700 hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {appointment.patientPhone}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p>{formatDateLabel(appointment.preferredDate)}</p>
                      <p className="text-xs text-neutral-500">{appointment.preferredTime}</p>
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <p className="line-clamp-2 text-sm text-neutral-600">
                        {appointment.reason || '—'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <AppointmentStatusBadge status={appointment.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {appointment.status === 'pending' ? (
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-full bg-sky-600 hover:bg-sky-700"
                            disabled={updatingId === appointment.appointmentId}
                            onClick={() =>
                              void updateStatus(appointment.appointmentId, 'confirmed')
                            }
                          >
                            Confirm
                          </Button>
                        ) : null}
                        <Select
                          value={appointment.status}
                          onValueChange={(value) =>
                            void updateStatus(
                              appointment.appointmentId,
                              value as AppointmentStatus,
                            )
                          }
                          disabled={updatingId === appointment.appointmentId}
                        >
                          <SelectTrigger className="w-[140px] rounded-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {APPOINTMENT_STATUSES.map((status) => (
                              <SelectItem key={status} value={status} className="capitalize">
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  )
}
