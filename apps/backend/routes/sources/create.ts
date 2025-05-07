import { createRoute, z } from '@hono/zod-openapi'
import { upsertChannel } from '../../actions/upsertChannel.ts'
import { tables } from '../../database/tables.ts'
import { createHandler } from '../../helpers/hono.ts'
import { db } from '../../instances/database.ts'
import { newSource } from '../../schemas/newSource.ts'
import { source } from '../../schemas/source.ts'

export const route = createRoute({
  method: 'post',
  path: '/sources',
  request: {
    body: {
      content: {
        'application/json': {
          schema: newSource.omit({ aliasId: true }).extend({ url: z.string().url() }),
        },
      },
      required: true,
      description: '',
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: source } },
      description: '',
    },
  },
})

export const handler = createHandler(route, async (context) => {
  const json = context.req.valid('json')

  const { alias } = await upsertChannel({ url: json.url })

  const [source] = await db
    .insert(tables.sources)
    .values({ ...json, aliasId: alias.id })
    .returning()

  return context.json(source, 201)
})
