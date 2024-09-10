import { client } from '../index.js'
import { seedChannels } from '../seeders/channels.js'
import { seedItems } from '../seeders/items.js'
import { seedSources } from '../seeders/sources.js'
import { seedUsers } from '../seeders/users.js'

await seedUsers()
await seedChannels()
await seedItems()
await seedSources()

await client.end()
