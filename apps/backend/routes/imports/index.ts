import { createRoute, z } from '@hono/zod-openapi'
import { createHandler } from '../../helpers/hono.ts'
import { importQueue } from '../../queues/import.ts'

export const route = createRoute({
  method: 'post',
  path: '/imports',
  request: {
    body: {
      content: { 'application/json': { schema: z.object({ url: z.string().url() }) } },
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
  const { url } = context.req.valid('json')

  await importQueue.add('importUrl', url)

  return context.json(200)
})
