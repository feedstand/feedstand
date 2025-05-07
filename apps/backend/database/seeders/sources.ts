import { random, sampleSize } from 'lodash-es'
import { db } from '../../instances/database.ts'
import type { NewSource } from '../../types/schemas.ts'
import { generateSource } from '../factories/source.ts'
import { tables } from '../tables.ts'

export const seedSources = async () => {
  const newSources: Array<NewSource> = []
  const allUsers = await db.select().from(tables.users)
  const allAliases = await db.select().from(tables.aliases)

  for (const user of allUsers) {
    const randomAliases = sampleSize(allAliases, random(1, allAliases.length))

    for (const alias of randomAliases) {
      newSources.push(generateSource({ userId: user.id, aliasId: alias.id }))
    }
  }

  await db.insert(tables.sources).values(newSources)
}
