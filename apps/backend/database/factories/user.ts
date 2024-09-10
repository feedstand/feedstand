import { faker } from '@faker-js/faker'
import { NewUser } from '../types.js'

export const generateUser = (user?: Partial<NewUser>): NewUser => {
    return {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
        emailVerifiedAt: new Date(),
        ...user,
    }
}
