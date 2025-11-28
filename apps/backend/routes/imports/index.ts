import { createRoute, z } from '@hono/zod-openapi'
import { createHandler } from '../../helpers/hono.ts'
import { importQueue } from '../../queues/import.ts'
import { safeUrl } from '../../schemas/safeUrl.ts'

const bodySchema = z
  .object({
    url: safeUrl.optional(),
    urls: z.array(safeUrl).optional(),
  })
  .refine((data) => data.url || data.urls, {
    message: 'Either url or urls must be provided',
  })

export const route = createRoute({
  method: 'post',
  path: '/imports',
  request: {
    body: {
      content: { 'application/json': { schema: bodySchema } },
      required: true,
      description: '',
    },
  },
  responses: {
    200: {
      description: '',
    },
  },
})

export const handler = createHandler(route, async (context) => {
  const { url, urls } = context.req.valid('json')
  const allUrls = urls ?? (url ? [url] : [])

  for (const item of allUrls) {
    await importQueue.add('importUrl', item)
  }

  return context.json(200)
})
