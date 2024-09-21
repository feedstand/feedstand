import { client } from '~/instances/database'
import { seedChannels } from '../seeders/channels'
import { seedItems } from '../seeders/items'
import { seedSources } from '../seeders/sources'
import { seedUsers } from '../seeders/users'

await seedUsers()
await seedChannels()
await seedItems()
await seedSources()

await client.end()
