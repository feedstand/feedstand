import { newChannel } from './newChannel.ts'

export const feedChannel = newChannel.pick({
  title: true,
  description: true,
  siteUrl: true,
  selfUrl: true,
})
