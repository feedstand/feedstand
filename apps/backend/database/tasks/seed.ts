import { client } from '../../instances/database'
import { seedAliases } from '../seeders/aliases'
import { seedChannels } from '../seeders/channels'
import { seedItems } from '../seeders/items'
import { seedSources } from '../seeders/sources'
import { seedUsers } from '../seeders/users'

await seedUsers()
await seedChannels()
await seedItems()
await seedAliases()
await seedSources()

await client.end()
