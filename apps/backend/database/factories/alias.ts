import { faker } from '@faker-js/faker'
import { capitalize } from 'lodash-es'
import type { NewAlias } from '../../types/schemas.ts'

export const generateAlias = (alias?: Partial<NewAlias>): NewAlias => {
  const createdAt = faker.date.between({ from: faker.date.past({ years: 10 }), to: new Date() })

  return {
    aliasUrl: faker.internet.url(),
    channelId: faker.number.int(),
    createdAt,
    updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
    ...alias,
  }
}
