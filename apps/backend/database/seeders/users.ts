import { tables } from '../../database/tables.ts'
import { db } from '../../instances/database.ts'
import { generateUser } from '../factories/user.ts'

export const seedUsers = async () => {
  await db.insert(tables.users).values([
    generateUser({
      email: 'test@tosteron.com',
      password: '12341234',
    }),
    ...Array(19).fill({}).map(generateUser),
  ])
}
