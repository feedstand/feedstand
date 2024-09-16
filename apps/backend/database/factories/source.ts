import { faker } from '@faker-js/faker'
import { NewSource } from '~/types/database.js'
import { capitalize } from 'lodash-es'

export const generateSource = (source?: Partial<NewSource>): NewSource => {
    const createdAt = faker.date.between({ from: faker.date.past({ years: 10 }), to: new Date() })

    return {
        name: capitalize(faker.lorem.words({ min: 1, max: 4 })),
        url: faker.internet.url(),
        userId: faker.number.bigInt(),
        channelId: faker.number.bigInt(),
        createdAt,
        updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
        ...source,
    }
}
