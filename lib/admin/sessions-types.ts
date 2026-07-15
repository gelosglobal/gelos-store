export type SessionsRange = {
  startDate: string
  endDate: string
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

export type SessionsAnalyticsPayload = {
  range: SessionsRange
  comparisonRange: SessionsRange
  refreshedAt: string
  snapshot: {
    sessions: number
    visitors: number
    sessionsChange: number
    visitorsChange: number
  }
  series: SessionsSeriesPoint[]
  rows: SessionsTableRow[]
}
