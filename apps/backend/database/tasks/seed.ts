import { client } from '../../instances/database.ts'
import { seedAliases } from '../seeders/aliases.ts'
import { seedChannels } from '../seeders/channels.ts'
import { seedItems } from '../seeders/items.ts'
import { seedSources } from '../seeders/sources.ts'
import { seedUsers } from '../seeders/users.ts'

await seedUsers()
await seedChannels()
await seedItems()
await seedAliases()
await seedSources()

await client.end()
