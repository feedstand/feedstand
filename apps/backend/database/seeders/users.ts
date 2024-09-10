import { generateUser } from '../factories/user.js'
import { db } from '../index.js'
import { users } from '../tables.js'

export const seedUsers = async () => {
    await db.insert(users).values([
        generateUser({
            email: 'test@tosteron.com',
            password: '12341234',
        }),
        ...Array(19).fill({}).map(generateUser),
    ])
}
