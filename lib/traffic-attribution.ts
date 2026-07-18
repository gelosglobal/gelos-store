export type TrafficType = 'paid' | 'organic' | 'direct' | 'unknown'

export type TrafficChannel =
  | 'facebook'
  | 'instagram'
  | 'google'
  | 'tiktok'
  | 'twitter'
  | 'youtube'
  | 'whatsapp'
  | 'email'
  | 'affiliate'
  | 'direct'
  | 'other'
  | 'unknown'

export type TrafficAttribution = {
  landingPath: string
  landingReferrer: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  trafficType: TrafficType
  channel: TrafficChannel
}

const PAID_MEDIUMS = new Set([
  'cpc',
  'ppc',
  'paid',
  'paid_social',
  'paid-social',
  'paidsocial',
  'display',
  'cpm',
  'retargeting',
  'ads',
  'ad',
])

const ORGANIC_MEDIUMS = new Set([
  'organic',
  'organic_social',
  'organic-social',
  'social',
  'referral',
  'seo',
])

const CHANNEL_HOST_MATCHERS: { channel: TrafficChannel; patterns: RegExp[] }[] =
  [
    {
      channel: 'facebook',
      patterns: [/facebook\.com$/i, /fb\.com$/i, /fb\.me$/i, /m\.facebook\.com$/i],
    },
    {
      channel: 'instagram',
      patterns: [/instagram\.com$/i, /l\.instagram\.com$/i],
    },
    {
      channel: 'google',
      patterns: [
        /google\./i,
        /googleusercontent\.com$/i,
        /googleapis\.com$/i,
        /gstatic\.com$/i,
      ],
    },
    {
      channel: 'tiktok',
      patterns: [/tiktok\.com$/i],
    },
    {
      channel: 'twitter',
      patterns: [/twitter\.com$/i, /x\.com$/i, /t\.co$/i],
    },
    {
      channel: 'youtube',
      patterns: [/youtube\.com$/i, /youtu\.be$/i],
    },
    {
      channel: 'whatsapp',
      patterns: [/whatsapp\.com$/i, /wa\.me$/i],
    },
  ]

const CHANNEL_SOURCE_MATCHERS: { channel: TrafficChannel; patterns: RegExp[] }[] =
  [
    { channel: 'facebook', patterns: [/^fb$/i, /facebook/i, /^meta$/i] },
    { channel: 'instagram', patterns: [/instagram/i, /^ig$/i] },
    { channel: 'google', patterns: [/google/i, /^gads$/i, /^adwords$/i] },
    { channel: 'tiktok', patterns: [/tiktok/i, /^tt$/i] },
    { channel: 'twitter', patterns: [/twitter/i, /^x$/i] },
    { channel: 'youtube', patterns: [/youtube/i, /^yt$/i] },
    { channel: 'whatsapp', patterns: [/whatsapp/i, /^wa$/i] },
    { channel: 'email', patterns: [/email/i, /newsletter/i, /mailchimp/i] },
    { channel: 'affiliate', patterns: [/affiliate/i, /^ref$/i, /partner/i] },
  ]

function hostnameFromUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  try {
    return new URL(trimmed).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

function channelFromHost(host: string): TrafficChannel | null {
  if (!host) return null
  for (const entry of CHANNEL_HOST_MATCHERS) {
    if (entry.patterns.some((pattern) => pattern.test(host))) {
      return entry.channel
    }
  }
  return null
}

function channelFromSource(source: string): TrafficChannel | null {
  const value = source.trim()
  if (!value) return null
  for (const entry of CHANNEL_SOURCE_MATCHERS) {
    if (entry.patterns.some((pattern) => pattern.test(value))) {
      return entry.channel
    }
  }
  return null
}

export function classifyTrafficAttribution(input: {
  path?: string
  referrer?: string
  landingReferrer?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}): TrafficAttribution {
  let landingPath = input.path?.trim().slice(0, 500) || '/'
  let utmSource = input.utmSource?.trim().slice(0, 120) ?? ''
  let utmMedium = input.utmMedium?.trim().slice(0, 120) ?? ''
  let utmCampaign = input.utmCampaign?.trim().slice(0, 120) ?? ''

  // Prefer UTMs embedded in the landing path query string.
  try {
    const pathForUrl = landingPath.startsWith('http')
      ? landingPath
      : `https://gelos.local${landingPath.startsWith('/') ? '' : '/'}${landingPath}`
    const url = new URL(pathForUrl)
    utmSource = utmSource || url.searchParams.get('utm_source')?.trim() || ''
    utmMedium = utmMedium || url.searchParams.get('utm_medium')?.trim() || ''
    utmCampaign =
      utmCampaign || url.searchParams.get('utm_campaign')?.trim() || ''
    if (!landingPath.startsWith('http')) {
      landingPath = `${url.pathname}${url.search}`
    }
  } catch {
    // keep raw path
  }

  const landingReferrer = (
    input.landingReferrer?.trim() ||
    input.referrer?.trim() ||
    ''
  ).slice(0, 500)

  const referrerHost = hostnameFromUrl(landingReferrer)
  const sourceChannel = channelFromSource(utmSource)
  const hostChannel = channelFromHost(referrerHost)
  const channel: TrafficChannel =
    sourceChannel ??
    hostChannel ??
    (utmSource || referrerHost ? 'other' : 'direct')

  const medium = utmMedium.toLowerCase()
  let trafficType: TrafficType = 'unknown'

  if (PAID_MEDIUMS.has(medium) || /paid|cpc|ppc|ads?/i.test(utmMedium)) {
    trafficType = 'paid'
  } else if (
    ORGANIC_MEDIUMS.has(medium) ||
    /organic|seo|social|referral/i.test(utmMedium)
  ) {
    trafficType = 'organic'
  } else if (utmSource || referrerHost) {
    // External source without paid medium → organic/referral.
    trafficType = 'organic'
  } else if (!landingReferrer && !utmSource) {
    trafficType = 'direct'
  }

  if (channel === 'direct' && trafficType === 'unknown') {
    trafficType = 'direct'
  }

  return {
    landingPath,
    landingReferrer,
    utmSource,
    utmMedium,
    utmCampaign,
    trafficType,
    channel: channel === 'unknown' && trafficType === 'direct' ? 'direct' : channel,
  }
}

export function formatSessionDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds))
  if (safe < 60) return `${safe}s`
  const minutes = Math.floor(safe / 60)
  const rem = safe % 60
  if (minutes < 60) return rem > 0 ? `${minutes}m ${rem}s` : `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export const TRAFFIC_TYPE_LABELS: Record<TrafficType, string> = {
  paid: 'Paid',
  organic: 'Organic',
  direct: 'Direct',
  unknown: 'Unknown',
}

export const TRAFFIC_CHANNEL_LABELS: Record<TrafficChannel, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  google: 'Google',
  tiktok: 'TikTok',
  twitter: 'X / Twitter',
  youtube: 'YouTube',
  whatsapp: 'WhatsApp',
  email: 'Email',
  affiliate: 'Affiliate',
  direct: 'Direct',
  other: 'Other',
  unknown: 'Unknown',
}
