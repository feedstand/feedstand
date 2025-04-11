import { tables } from '../../database/tables.js'
import { db } from '../../instances/database.js'
import { generateUser } from '../factories/user.js'

export const seedUsers = async () => {
  await db.insert(tables.users).values([
    generateUser({
      email: 'test@tosteron.com',
      password: '12341234',
    }),
    ...Array(19).fill({}).map(generateUser),
  ])
}
