import { random } from 'lodash-es'
import { db } from '../../instances/database.js'
import type { NewAlias } from '../../types/schemas.js'
import { generateAlias } from '../factories/alias.js'
import { tables } from '../tables.js'

export const seedAliases = async () => {
  const newAliases: Array<NewAlias> = []
  const allUsers = await db.select().from(tables.users)
  const allChannels = await db.select().from(tables.channels)

  for (let i = 0; i < 100; ++i) {
    const randomChannel = allChannels[random(0, allChannels.length - 1)]

    newAliases.push(generateAlias({ channelId: randomChannel.id }))
  }

  await db.insert(tables.aliases).values(newAliases)
}
