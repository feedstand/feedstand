import { faker } from '@faker-js/faker'
import { capitalize } from 'lodash-es'
import type { NewItem } from '../../types/schemas.ts'

export const generateItem = (item?: Partial<NewItem>): NewItem => {
  const publishedAt = faker.date.between({ from: faker.date.past({ years: 10 }), to: new Date() })

  return {
    channelId: faker.number.int(),
    title: capitalize(faker.lorem.words({ min: 2, max: 8 })),
    link: faker.internet.url(),
    description: faker.lorem.sentences({ min: 1, max: 2 }),
    author: faker.person.fullName(),
    guid: faker.string.uuid(),
    content: faker.lorem.paragraphs({ min: 2, max: 10 }),
    itemHash: faker.string.uuid(),
    contentHash: faker.string.uuid(),
    publishedAt,
    rawPublishedAt: publishedAt.toISOString(),
    ...item,
  }
}
