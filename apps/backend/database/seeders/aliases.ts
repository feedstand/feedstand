import { random } from 'lodash-es'
import { db } from '../../instances/database'
import type { NewAlias } from '../../types/schemas'
import { generateAlias } from '../factories/alias'
import { tables } from '../tables'

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
