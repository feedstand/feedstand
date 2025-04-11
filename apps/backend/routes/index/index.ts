import { createRoute, z } from '@hono/zod-openapi'
import { version } from '../../constants/app.js'
import { createHandler } from '../../helpers/hono.js'

export const route = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            healthy: z.boolean(),
            version: z.string(),
          }),
        },
      },
      description: 'Return boolean indicating app health and the version tag.',
    },
  },
})

export const handler = createHandler(route, async (context) => {
  return context.json({ healthy: true, version }, 200)
})
