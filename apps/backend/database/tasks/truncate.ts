import { client, db } from '../index.js'
import { sql, getTableName } from 'drizzle-orm'
import * as tables from '../tables.js'

const tableNames = Object.values(tables).map(getTableName)
const tableIdentifiers = tableNames.map(sql.identifier)
const tablesJoined = sql.join(tableIdentifiers, sql`, `)

await db.execute(sql`TRUNCATE TABLE ${tablesJoined} RESTART IDENTITY CASCADE;`)

await client.end()
