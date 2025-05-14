import { findFeeds } from '../actions/findFeeds.ts'
import { upsertChannel } from '../actions/upsertChannel.ts'

export const importUrl = async (url: string) => {
  const { feeds } = await findFeeds({ url })

  for (const feed of feeds) {
    await upsertChannel({ url: feed.url })
    // importQueue.add('importFeed', feed.url)
  }
}
