import { faker } from '@faker-js/faker'
import { NewChannel } from '../types.js'
import { capitalize } from 'lodash-es'

export const generateChannel = (channel?: Partial<NewChannel>): NewChannel => {
    return {
        link: faker.internet.url(),
        url: faker.internet.url(),
        title: capitalize(faker.lorem.words({ min: 1, max: 4 })),
        description: faker.lorem.sentences({ min: 1, max: 2 }),
        ...channel,
    }
}
