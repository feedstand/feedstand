import { anyFeedContentTypes } from './fetchers'

export const feedLinkSelectors = anyFeedContentTypes.map(
    (contentType) => `link[type*="${contentType}"][rel="alternate"]`,
)

export const youTubeDomains = ['youtu.be', 'youtube.com']
