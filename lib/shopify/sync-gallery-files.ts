import { shopifyAdminFetch } from '@/lib/shopify/admin-client'
import {
  SHOPIFY_GALLERY_METAFIELD_KEY,
  SHOPIFY_GALLERY_METAFIELD_NAMESPACE,
} from '@/lib/shopify/gallery-metafield'
import {
  dedupeGallerySourceEntriesAsync,
  encodeGalleryVideo,
  isGalleryVideoEntry,
  parseGalleryMediaItem,
} from '@/lib/product-gallery-images'

type FileContentType = 'IMAGE' | 'VIDEO' | 'FILE'

type CreatedFile = {
  id: string
  fileStatus?: string | null
}

type RemoteFileMeta = {
  mimeType: string | null
  filename: string | null
  fileSize: number | null
}

/**
 * Turn Gelos gallery entries (`url` or `video:url`) into absolute http(s) URLs
 * Shopify can fetch. Relative `/gelos/...` paths use NEXT_PUBLIC_APP_URL.
 */
export function resolvePublicGalleryUrls(entries: string[]): string[] {
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    ''
  )
    .trim()
    .replace(/\/$/, '')

  const out: string[] = []
  for (const raw of entries) {
    const item = parseGalleryMediaItem(raw)
    if (!item) continue
    let url = item.url.trim()
    if (url.startsWith('/')) {
      if (!appUrl) {
        console.warn(
          `[gallery-sync] Skipping relative URL (set NEXT_PUBLIC_APP_URL): ${url}`,
        )
        continue
      }
      url = `${appUrl}${url}`
    }
    if (!/^https?:\/\//i.test(url)) {
      console.warn(`[gallery-sync] Skipping non-http URL: ${url}`)
      continue
    }
    out.push(url)
  }
  return [...new Set(out)]
}

function extensionFromMime(mimeType: string | null): string | null {
  if (!mimeType) return null
  const normalized = mimeType.split(';')[0]?.trim().toLowerCase()
  switch (normalized) {
    case 'video/mp4':
      return 'mp4'
    case 'video/webm':
      return 'webm'
    case 'video/quicktime':
      return 'mov'
    case 'image/png':
      return 'png'
    case 'image/jpeg':
      return 'jpg'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    default:
      return null
  }
}

function ensureFilenameExtension(
  filename: string,
  mimeType: string | null,
): string {
  const base = filename.replace(/[^\w.\-()+ ]+/g, '_').trim() || 'gallery-file'
  if (/\.[a-z0-9]+$/i.test(base)) return base
  const ext = extensionFromMime(mimeType)
  return ext ? `${base}.${ext}` : base
}

async function peekRemoteFileMeta(url: string): Promise<RemoteFileMeta> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
    })
    clearTimeout(timer)

    const mimeType = response.headers.get('content-type')
    const lengthHeader = response.headers.get('content-length')
    const fileSize = lengthHeader ? Number.parseInt(lengthHeader, 10) : null
    const disposition = response.headers.get('content-disposition') || ''
    const match =
      /filename\*=UTF-8''([^;]+)|filename="([^"]+)"|filename=([^;]+)/i.exec(
        disposition,
      )
    const rawName = match?.[1] || match?.[2] || match?.[3]
    const filename = rawName ? decodeURIComponent(rawName.trim()) : null

    return {
      mimeType,
      filename,
      fileSize: Number.isFinite(fileSize) ? fileSize : null,
    }
  } catch {
    return { mimeType: null, filename: null, fileSize: null }
  }
}

function isVideoMeta(meta: RemoteFileMeta, rawEntry: string, url: string) {
  if (isGalleryVideoEntry(rawEntry)) return true
  if (meta.mimeType?.toLowerCase().startsWith('video/')) return true
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)
}

function isImageMeta(meta: RemoteFileMeta, url: string) {
  if (meta.mimeType?.toLowerCase().startsWith('image/')) return true
  return /\.(png|jpe?g|gif|webp|heic)(\?|$)/i.test(url)
}

/**
 * Shopify requires staged uploads for VIDEO — remote URLs (especially
 * extensionless UploadThing / .mov) fail or land as GenericFile otherwise.
 */
async function uploadVideoViaStagedUpload(input: {
  url: string
  meta: RemoteFileMeta
}): Promise<string> {
  const response = await fetch(input.url, { redirect: 'follow' })
  if (!response.ok) {
    throw new Error(`Failed to download video (${response.status})`)
  }

  const bytes = Buffer.from(await response.arrayBuffer())
  const mimeType =
    input.meta.mimeType?.split(';')[0]?.trim() ||
    response.headers.get('content-type')?.split(';')[0]?.trim() ||
    'video/mp4'
  const filename = ensureFilenameExtension(
    input.meta.filename || `gallery-video.${extensionFromMime(mimeType) || 'mp4'}`,
    mimeType,
  )

  const staged = await shopifyAdminFetch<{
    stagedUploadsCreate: {
      stagedTargets: Array<{
        url: string
        resourceUrl: string
        parameters: Array<{ name: string; value: string }>
      }>
      userErrors: Array<{ message: string }>
    }
  }>(
    /* GraphQL */ `
      mutation GelosStagedUploads($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters {
              name
              value
            }
          }
          userErrors {
            message
          }
        }
      }
    `,
    {
      input: [
        {
          filename,
          mimeType,
          fileSize: String(bytes.byteLength),
          resource: 'VIDEO',
          httpMethod: 'POST',
        },
      ],
    },
  )

  if (staged.stagedUploadsCreate.userErrors.length) {
    throw new Error(
      staged.stagedUploadsCreate.userErrors.map((e) => e.message).join('; '),
    )
  }

  const target = staged.stagedUploadsCreate.stagedTargets[0]
  if (!target?.url || !target.resourceUrl) {
    throw new Error('No staged upload target returned')
  }

  const form = new FormData()
  for (const param of target.parameters) {
    form.append(param.name, param.value)
  }
  form.append(
    'file',
    new Blob([bytes], { type: mimeType }),
    filename,
  )

  const uploadResponse = await fetch(target.url, {
    method: 'POST',
    body: form,
  })
  if (!uploadResponse.ok) {
    const text = await uploadResponse.text().catch(() => '')
    throw new Error(
      `Staged upload failed (${uploadResponse.status}): ${text.slice(0, 200)}`,
    )
  }

  const created = await shopifyAdminFetch<{
    fileCreate: {
      files: Array<CreatedFile | null>
      userErrors: Array<{ message: string }>
    }
  }>(
    /* GraphQL */ `
      mutation GelosVideoFileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            ... on Video {
              id
              fileStatus
            }
          }
          userErrors {
            message
          }
        }
      }
    `,
    {
      files: [
        {
          originalSource: target.resourceUrl,
          contentType: 'VIDEO',
          alt: 'Gelos product gallery',
        },
      ],
    },
  )

  if (created.fileCreate.userErrors.length) {
    throw new Error(
      created.fileCreate.userErrors.map((e) => e.message).join('; '),
    )
  }

  const id = created.fileCreate.files[0]?.id
  if (!id) throw new Error('No video file id returned')

  await waitForFilesReady([id], 40)
  return id
}

async function uploadRemoteFileCreate(input: {
  url: string
  contentType: FileContentType
  filename?: string | null
}): Promise<string> {
  const data = await shopifyAdminFetch<{
    fileCreate: {
      files: Array<CreatedFile | null>
      userErrors: Array<{ message: string }>
    }
  }>(
    /* GraphQL */ `
      mutation GelosFileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            ... on MediaImage {
              id
              fileStatus
            }
            ... on Video {
              id
              fileStatus
            }
            ... on GenericFile {
              id
              fileStatus
            }
          }
          userErrors {
            message
          }
        }
      }
    `,
    {
      files: [
        {
          originalSource: input.url,
          contentType: input.contentType,
          alt: 'Gelos product gallery',
          duplicateResolutionMode: input.filename ? 'REPLACE' : 'APPEND_UUID',
          ...(input.filename
            ? { filename: ensureFilenameExtension(input.filename, null) }
            : {}),
        },
      ],
    },
  )

  if (data.fileCreate.userErrors.length) {
    throw new Error(
      data.fileCreate.userErrors.map((error) => error.message).join('; '),
    )
  }

  const id = data.fileCreate.files[0]?.id
  if (!id) throw new Error('No file id returned')
  await waitForFilesReady([id])
  return id
}

/**
 * Upload remote files into Shopify Files and return MediaImage/Video GIDs.
 * Requires Admin API scopes: read_files, write_files.
 * Dedupes source URLs, and stage-uploads videos (required by Shopify).
 */
export async function uploadGalleryFilesToShopify(
  entries: string[],
): Promise<string[]> {
  const deduped = await dedupeGallerySourceEntriesAsync(entries)
  const pairs = deduped
    .map((raw) => {
      const item = parseGalleryMediaItem(raw)
      if (!item) return null
      const [absolute] = resolvePublicGalleryUrls([
        item.type === 'video' ? encodeGalleryVideo(item.url) : item.url,
      ])
      if (!absolute) return null
      return { raw, url: absolute, isVideoHint: item.type === 'video' }
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))

  if (pairs.length === 0) return []

  console.log(
    `[gallery-sync] Uploading ${pairs.length} unique file(s) (from ${entries.length} source entr${entries.length === 1 ? 'y' : 'ies'})`,
  )

  const ids: string[] = []

  for (const pair of pairs) {
    const meta = await peekRemoteFileMeta(pair.url)
    const asVideo = isVideoMeta(meta, pair.raw, pair.url)
    let uploaded = false
    let lastError = ''

    if (asVideo) {
      const mime = meta.mimeType?.toLowerCase() || ''
      // Shopify video pipeline accepts mp4/mov; WebM usually fails processing.
      // Keep WebM as remote video: URLs in custom.pdp (merged on the storefront).
      if (
        mime.includes('webm') ||
        /\.webm(\?|$)/i.test(pair.url) ||
        /\.webm$/i.test(meta.filename || '')
      ) {
        console.log(
          `[gallery-sync] Keeping remote WebM (Shopify can't process it): ${meta.filename || pair.url}`,
        )
        continue
      }

      try {
        const id = await uploadVideoViaStagedUpload({ url: pair.url, meta })
        ids.push(id)
        uploaded = true
        console.log(`[gallery-sync] ✓ video ${meta.filename || pair.url}`)
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error)
        console.warn(
          `[gallery-sync] Video staged upload failed (${lastError}). Keeping remote URL via custom.pdp.`,
        )
        // Not a hard failure — custom.pdp still has video: URL for the storefront.
        continue
      }
    } else {
      const attempts: FileContentType[] = isImageMeta(meta, pair.url)
        ? ['IMAGE', 'FILE']
        : ['FILE', 'IMAGE']
      const filename = meta.filename
        ? ensureFilenameExtension(meta.filename, meta.mimeType)
        : null

      for (const contentType of attempts) {
        try {
          const id = await uploadRemoteFileCreate({
            url: pair.url,
            contentType,
            filename:
              contentType === 'IMAGE' && filename && /\.(png|jpe?g|gif|webp)$/i.test(filename)
                ? filename
                : null,
          })
          ids.push(id)
          uploaded = true
          break
        } catch (error) {
          lastError = error instanceof Error ? error.message : String(error)
        }
      }
    }

    if (!uploaded) {
      console.warn(
        `[gallery-sync] Skipping file (${lastError || 'unknown error'}): ${pair.url}`,
      )
    }
  }

  if (ids.length === 0) {
    throw new Error('No gallery files could be uploaded')
  }

  return ids
}

async function waitForFilesReady(fileIds: string[], attempts = 20) {
  if (fileIds.length === 0) return

  const query = /* GraphQL */ `
    query GelosFileStatus($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on MediaImage {
          id
          fileStatus
        }
        ... on Video {
          id
          fileStatus
        }
        ... on GenericFile {
          id
          fileStatus
        }
      }
    }
  `

  for (let attempt = 0; attempt < attempts; attempt++) {
    const data = await shopifyAdminFetch<{
      nodes: Array<{ id?: string; fileStatus?: string | null } | null>
    }>(query, { ids: fileIds })

    const statuses = data.nodes.map((node) => node?.fileStatus ?? 'UNKNOWN')
    const pending = statuses.some(
      (status) =>
        status === 'UPLOADED' ||
        status === 'PROCESSING' ||
        status === 'UNKNOWN',
    )
    const failed = statuses.filter((status) => status === 'FAILED')
    if (failed.length) {
      throw new Error(`Shopify file processing failed (${failed.length} file(s))`)
    }
    if (!pending) return

    await new Promise((resolve) => setTimeout(resolve, 1500))
  }
}

/** Set product metafield custom.gallery to uploaded file GIDs. */
export async function setShopifyProductGalleryMetafield(input: {
  productGid: string
  fileGids: string[]
}) {
  const mutation = /* GraphQL */ `
    mutation GelosGalleryMetafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          key
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const data = await shopifyAdminFetch<{
    metafieldsSet: {
      metafields: Array<{ id: string; key: string }> | null
      userErrors: Array<{ field?: string[] | null; message: string }>
    }
  }>(mutation, {
    metafields: [
      {
        ownerId: input.productGid,
        namespace: SHOPIFY_GALLERY_METAFIELD_NAMESPACE,
        key: SHOPIFY_GALLERY_METAFIELD_KEY,
        type: 'list.file_reference',
        value: JSON.stringify(input.fileGids),
      },
    ],
  })

  if (data.metafieldsSet.userErrors.length) {
    throw new Error(
      data.metafieldsSet.userErrors.map((error) => error.message).join('; '),
    )
  }
}
