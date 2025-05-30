import { faker } from '@faker-js/faker'
import { capitalize } from 'lodash-es'
import type { NewSource } from '../../types/schemas.ts'

export const generateSource = (source?: Partial<NewSource>): NewSource => {
  const createdAt = faker.date.between({ from: faker.date.past({ years: 10 }), to: new Date() })

  return {
    name: capitalize(faker.lorem.words({ min: 1, max: 4 })),
    userId: faker.number.int(),
    aliasId: faker.number.int(),
    createdAt,
    updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
    ...source,
  }
}
