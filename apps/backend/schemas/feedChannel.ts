import { newChannel } from './newChannel.js'

export const feedChannel = newChannel.pick({
  title: true,
  description: true,
  siteUrl: true,
  selfUrl: true,
})
