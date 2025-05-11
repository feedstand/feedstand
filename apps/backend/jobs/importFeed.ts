import { upsertChannel } from '../actions/upsertChannel.ts'

export const importFeed = async (url: string) => {
  await upsertChannel({ url })
}
