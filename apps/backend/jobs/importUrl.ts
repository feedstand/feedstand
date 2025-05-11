import { findFeeds } from '../actions/findFeeds.ts'
import { importQueue } from '../queues/import.ts'

export const importUrl = async (url: string) => {
  const { feeds } = await findFeeds({ url })

  feeds.forEach((feed) => {
    importQueue.add('importFeed', feed.url)
  })
}
