import { newChannel } from './newChannel'

export const feedChannel = newChannel.pick({
  title: true,
  description: true,
  siteUrl: true,
  feedUrl: true,
})
