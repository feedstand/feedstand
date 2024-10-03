import { newChannel } from './newChannel'

export const feedChannel = newChannel.pick({
    url: true,
    title: true,
    link: true,
    description: true,
})
