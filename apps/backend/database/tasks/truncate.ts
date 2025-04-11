import { getTableName, sql } from 'drizzle-orm'
import { client, db } from '../../instances/database.js'
import { tables } from '../tables.js'

const tableNames = Object.values(tables).map(getTableName)
const tableIdentifiers = tableNames.map(sql.identifier)
const tablesJoined = sql.join(tableIdentifiers, sql`, `)

await db.execute(sql`TRUNCATE TABLE ${tablesJoined} RESTART IDENTITY CASCADE;`)

await client.end()
