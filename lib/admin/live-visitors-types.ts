export type LiveVisitorSession = {
  visitorId: string
  path: string
  pathLabel: string
  referrer: string
  referrerLabel: string
  lastSeenAt: string
  lastSeenLabel: string
}

export type LivePageRow = {
  path: string
  pathLabel: string
  visitors: number
}

export type LiveVisitorsPayload = {
  liveCount: number
  todayVisitors: number
  activePages: LivePageRow[]
  sessions: LiveVisitorSession[]
  activeWindowSeconds: number
  refreshedAt: string
}
