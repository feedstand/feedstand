import { createRoute, z } from '@hono/zod-openapi'
import { upsertChannel } from '../../actions/upsertChannel'
import { tables } from '../../database/tables'
import { createHandler } from '../../helpers/hono'
import { db } from '../../instances/database'
import { newSource } from '../../schemas/newSource'
import { source } from '../../schemas/source'

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
