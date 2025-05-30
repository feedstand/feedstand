import { faker } from '@faker-js/faker'
import type { NewUser } from '../../types/schemas.ts'

export const generateUser = (user?: Partial<NewUser>): NewUser => {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    emailVerifiedAt: new Date(),
    ...user,
  }
}
