import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin'
import { extractRouterConfig } from 'uploadthing/server'
import { ourFileRouter } from '@/app/api/uploadthing/core'

export function UploadThingSSRPlugin() {
  return (
    <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
  )
}
