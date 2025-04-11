import type { FetchFeedProcessor } from '../../actions/fetchFeed.js'

export const iTunesFeed: FetchFeedProcessor = async (_, next) => {
  // TODO: Implement extracting the new feed URL.
  // Example: https://feeds.feedburner.com/potentialchurchpodcastaudio
  // Returns: <itunes:https://potentialaudio.podbean.com/feed/>
  await next()
}
