import { HttpError, parseRequestToSchema } from '~/helpers/routes'
import { z } from 'zod'
import { db } from '~/instances/database'
import { FastifyRequest } from 'fastify'
import * as tables from '~/database/tables'
import { eq } from 'drizzle-orm'

export const fetchRecordById = async <T extends (typeof tables)[keyof typeof tables]>(
    request: FastifyRequest,
    table: T,
): Promise<T['$inferSelect']> => {
    const schema = z.object({ params: z.object({ id: z.coerce.number() }) })
    const { params } = parseRequestToSchema({ request, schema })

    const [record] = await db.select().from(table).where(eq(table.id, params.id)).limit(1)

    if (!record) {
        throw new HttpError(404)
    }

    return record as T['$inferSelect']
}
