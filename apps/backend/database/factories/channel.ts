import { faker } from '@faker-js/faker'
import { capitalize } from 'lodash-es'
import { NewChannel } from '~/types/database'

export const generateChannel = (channel?: Partial<NewChannel>): NewChannel => {
    const createdAt = faker.date.between({ from: faker.date.past({ years: 10 }), to: new Date() })

    return {
        link: faker.internet.url(),
        url: faker.internet.url(),
        title: capitalize(faker.lorem.words({ min: 1, max: 4 })),
        description: faker.lorem.sentences({ min: 1, max: 2 }),
        createdAt,
        updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
        lastScannedAt: faker.date.between({ from: createdAt, to: new Date() }),
        ...channel,
    }
}
