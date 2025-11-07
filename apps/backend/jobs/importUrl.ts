import { findFeeds } from '../actions/findFeeds.ts'
import { importFeed } from '../jobs/importFeed.ts'

export const importUrl = async (url: string) => {
  const { feeds } = await findFeeds({ url })

  for (const feed of feeds) {
    // For now skip the queue and import right away.
    // importQueue.add('importFeed', feed.url)
    await importFeed(feed.url)
  }
}
