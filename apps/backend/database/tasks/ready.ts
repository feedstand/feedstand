import { count, inArray } from 'drizzle-orm'
import { readMigrationFiles } from 'drizzle-orm/migrator'
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import config from '../../drizzle.config'
import { client, db } from '../../instances/database'

export const checkMigrationsReady = async () => {
    if (!config.out || !config.migrations?.table) {
        return
    }

    let exitCode = 1

    const migrationsTable = pgTable(config.migrations?.table, {
        id: integer('id').primaryKey(),
        hash: text('hash').notNull(),
        created_at: timestamp('created_at').notNull(),
    })

    try {
        const migrationHashes = readMigrationFiles({
            migrationsSchema: config.migrations?.schema,
            migrationsTable: config.migrations?.table,
            migrationsFolder: config.out,
        }).map((migrationItem) => migrationItem.hash)

        const [{ migrationsCount }] = await db
            .select({ migrationsCount: count() })
            .from(migrationsTable)
            .where(inArray(migrationsTable.hash, migrationHashes))

        exitCode = migrationsCount === migrationHashes.length ? 0 : 1
    } catch (error) {
        exitCode = 1
    }

    process.exit(exitCode)
}

await checkMigrationsReady()
await client.end()
