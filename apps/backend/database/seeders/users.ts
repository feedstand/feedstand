import { tables } from '../../database/tables'
import { db } from '../../instances/database'
import { generateUser } from '../factories/user'

export const seedUsers = async () => {
  await db.insert(tables.users).values([
    generateUser({
      email: 'test@tosteron.com',
      password: '12341234',
    }),
    ...Array(19).fill({}).map(generateUser),
  ])
}
