import { count, inArray } from 'drizzle-orm'
import { readMigrationFiles } from 'drizzle-orm/migrator'
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import * as databaseConstants from '../../constants/database'
import { client, db } from '../../instances/database'

export const checkMigrationsReady = async () => {
    let exitCode = 1

    const migrationsTable = pgTable(databaseConstants.migrationsTable, {
        id: integer('id').primaryKey(),
        hash: text('hash').notNull(),
        created_at: timestamp('created_at').notNull(),
    })

    try {
        const migrationHashes = readMigrationFiles({
            migrationsSchema: databaseConstants.migrationsSchema,
            migrationsTable: databaseConstants.migrationsTable,
            migrationsFolder: databaseConstants.migrationsFolder,
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
