export type LiveVisitorSession = {
  visitorId: string
  path: string
  pathLabel: string
  referrer: string
  referrerLabel: string
  locationId: string
  locationLabel: string
  locationDisplayLabel: string
  locationFlag: string
  lastSeenAt: string
  lastSeenLabel: string
}

export type LivePageRow = {
  path: string
  pathLabel: string
  visitors: number
}

export type LiveLocationRow = {
  key: string
  locationId: string
  locationLabel: string
  locationDisplayLabel: string
  locationFlag: string
  visitors: number
}

export type LiveVisitorsPayload = {
  liveCount: number
  todayVisitors: number
  activePages: LivePageRow[]
  activeLocations: LiveLocationRow[]
  sessions: LiveVisitorSession[]
  activeWindowSeconds: number
  refreshedAt: string
}
