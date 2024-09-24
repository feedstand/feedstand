import { eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import { HTTPException } from 'hono/http-exception'
import { pick } from 'lodash-es'
import { z } from 'zod'
import { tables } from '~/database/tables'
import { validate } from '~/helpers/routes'
import { db } from '~/instances/database'
import { hono } from '~/instances/hono'

const paramSchema = z.object({ id: z.number() })

const jsonSchema = createSelectSchema(tables.sources).pick({ name: true, isReadabilitified: true })

hono.patch(
    '/sources/:id',
    validate('param', paramSchema),
    validate('json', jsonSchema),
    async (context) => {
        const params = context.req.valid('param')
        const json = context.req.valid('json')

        const [existingSource] = await db
            .select()
            .from(tables.sources)
            .where(eq(tables.sources.id, params.id))
            .limit(1)

        if (!existingSource) {
            throw new HTTPException(404)
        }

        const fields = ['name', 'isReadabilitified']
        const [updatedSource] = await db
            .update(tables.sources)
            .set({ ...existingSource, ...pick(json, fields) })
            .where(eq(tables.sources.id, existingSource.id))
            .returning()

        return context.json(updatedSource)
    },
)
