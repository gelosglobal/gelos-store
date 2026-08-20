function bool(value: string | undefined, fallback = false): boolean {
  if (value === undefined || value === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

function integer(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

export type WhatsappAgentConfig = {
  adminApiToken: string
  whatsappEnabled: boolean
  excelSyncEnabled: boolean
  openai: {
    apiKey: string
    projectId: string
    model: string
    maxOutputTokens: number
  }
  meta: {
    graphApiVersion: string
    accessToken: string
    appSecret: string
    verifyToken: string
    phoneNumberId: string
    wabaId: string
    staffNumber: string
    /** Meta Commerce Catalog ID connected to the WABA (for product messages). */
    catalogId: string
    /**
     * When true, prefer native Meta single/multi-product + catalog browse messages.
     * Leave false to use image product cards (recommended until catalog perms are ready).
     */
    catalogMessagesEnabled: boolean
  }
  microsoft: {
    tenantId: string
    clientId: string
    clientSecret: string
    refreshToken: string
    accessToken: string
    driveId: string
    driveItemId: string
    tableName: string
  }
}

export function getWhatsappAgentConfig(): WhatsappAgentConfig {
  return {
    adminApiToken: process.env.WHATSAPP_AGENT_ADMIN_TOKEN?.trim() || '',
    whatsappEnabled: bool(process.env.WHATSAPP_AGENT_ENABLED),
    excelSyncEnabled: bool(process.env.WHATSAPP_EXCEL_SYNC_ENABLED),
    openai: {
      apiKey:
        process.env.WHATSAPP_OPENAI_API_KEY?.trim() ||
        process.env.OPENAI_API_KEY?.trim() ||
        '',
      projectId: process.env.OPENAI_PROJECT_ID?.trim() || '',
      model: process.env.WHATSAPP_OPENAI_MODEL?.trim() || 'gpt-5.4-mini',
      maxOutputTokens: integer(process.env.WHATSAPP_OPENAI_MAX_OUTPUT_TOKENS, 700),
    },
    meta: {
      graphApiVersion: process.env.META_GRAPH_API_VERSION?.trim() || 'v21.0',
      accessToken: process.env.META_ACCESS_TOKEN?.trim() || '',
      appSecret: process.env.META_APP_SECRET?.trim() || '',
      verifyToken: process.env.META_VERIFY_TOKEN?.trim() || '',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || '',
      wabaId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim() || '',
      staffNumber: process.env.STAFF_WHATSAPP_NUMBER?.trim() || '',
      catalogId: process.env.META_CATALOG_ID?.trim() || '',
      catalogMessagesEnabled: bool(process.env.WHATSAPP_META_CATALOG_MESSAGES),
    },
    microsoft: {
      tenantId: process.env.MICROSOFT_TENANT_ID?.trim() || '',
      clientId: process.env.MICROSOFT_CLIENT_ID?.trim() || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET?.trim() || '',
      refreshToken: process.env.MICROSOFT_REFRESH_TOKEN?.trim() || '',
      accessToken: process.env.MICROSOFT_ACCESS_TOKEN?.trim() || '',
      driveId: process.env.EXCEL_DRIVE_ID?.trim() || '',
      driveItemId: process.env.EXCEL_DRIVE_ITEM_ID?.trim() || '',
      tableName: process.env.EXCEL_TABLE_NAME?.trim() || 'GelosOrders',
    },
  }
}

export function getWhatsappAgentReadiness(
  currentConfig: WhatsappAgentConfig = getWhatsappAgentConfig(),
) {
  const openaiReady = Boolean(
    currentConfig.openai.apiKey && currentConfig.openai.model,
  )
  const whatsappCredentialsReady = Boolean(
    currentConfig.meta.graphApiVersion &&
      currentConfig.meta.accessToken &&
      currentConfig.meta.appSecret &&
      currentConfig.meta.verifyToken &&
      currentConfig.meta.phoneNumberId,
  )
  const excelCredentialsReady = Boolean(
    currentConfig.microsoft.driveItemId &&
      currentConfig.microsoft.tableName &&
      (currentConfig.microsoft.accessToken ||
        (currentConfig.microsoft.tenantId &&
          currentConfig.microsoft.clientId &&
          currentConfig.microsoft.clientSecret &&
          currentConfig.microsoft.refreshToken)),
  )
  return {
    openaiReady,
    whatsappCredentialsReady,
    whatsappLive:
      currentConfig.whatsappEnabled &&
      whatsappCredentialsReady &&
      openaiReady,
    metaCatalogReady: Boolean(
      currentConfig.meta.catalogId &&
        currentConfig.meta.accessToken &&
        currentConfig.meta.catalogMessagesEnabled,
    ),
    excelCredentialsReady,
    excelLive: currentConfig.excelSyncEnabled && excelCredentialsReady,
    adminProtected: Boolean(currentConfig.adminApiToken),
  }
}
