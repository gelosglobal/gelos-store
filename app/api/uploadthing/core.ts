import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'

const f = createUploadthing()

/**
 * Admin uploads — add real auth in middleware before production.
 * @see https://docs.uploadthing.com/file-routes#route-config
 */
export const ourFileRouter = {
  productImage: f({
    image: {
      maxFileSize: '8MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      if (!process.env.UPLOADTHING_TOKEN) {
        throw new UploadThingError('UploadThing is not configured')
      }
      return { scope: 'admin-product' as const }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),

  storeLogo: f({
    image: {
      maxFileSize: '2MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      if (!process.env.UPLOADTHING_TOKEN) {
        throw new UploadThingError('UploadThing is not configured')
      }
      return { scope: 'admin-branding' as const }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
