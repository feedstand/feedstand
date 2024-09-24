import { desc } from 'drizzle-orm'
import { tables } from '~/database/tables'
import { db } from '~/instances/database'
import { hono } from '~/instances/hono'

hono.get('/sources', async (context) => {
    const sources = await db.select().from(tables.sources).orderBy(desc(tables.sources.createdAt))

    return context.json(sources)
})
