export type SessionsRange = {
  startDate: string
  endDate: string
  /** Local time `HH:mm` — defaults to 00:00 */
  startTime?: string
  /** Local time `HH:mm` — defaults to 23:59 */
  endTime?: string
}

export type SessionsSeriesPoint = {
  date: string
  label: string
  sessions: number
  visitors: number
  previousSessions: number
}

export type SessionsTableRow = {
  key: string
  label: string
  visitors: number
  sessions: number
}

export type SessionsTrafficTypeRow = {
  type: 'paid' | 'organic' | 'direct' | 'unknown'
  label: string
  sessions: number
  share: number
}

export type SessionsTrafficChannelRow = {
  channel: string
  label: string
  sessions: number
  share: number
}

export type SessionsAnalyticsPayload = {
  range: SessionsRange
  comparisonRange: SessionsRange
  refreshedAt: string
  granularity: 'hour' | 'day'
  snapshot: {
    sessions: number
    visitors: number
    sessionsChange: number
    visitorsChange: number
    avgSessionDurationSeconds: number
  }
  trafficTypes: SessionsTrafficTypeRow[]
  trafficChannels: SessionsTrafficChannelRow[]
  series: SessionsSeriesPoint[]
  rows: SessionsTableRow[]
}
