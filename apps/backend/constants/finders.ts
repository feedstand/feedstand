import { anyFeedContentTypes } from './fetchers'

export const feedLinkSelectors = anyFeedContentTypes.map(
  (contentType) => `link[type*="${contentType}"][rel="alternate"]`,
)

export const youTubeDomains = ['youtu.be', 'youtube.com']

export const feedUris = [
  '/feed',
  '/rss',
  '/atom',
  '/rss.xml',
  '/atom.xml',
  '/feed.xml',
  '/feed.rss',
  '/feed.atom',
  '/feed.rss.xml',
  '/feed.atom.xml',
  '/index.xml',
  '/index.rss',
  '/index.atom',
  '/index.rss.xml',
  '/index.atom.xml',
  '/?format=rss',
  '/?format=atom',
  '/?rss=1',
  '/?atom=1',
  '/?feed=rss',
  '/?feed=rss2',
  '/?feed=atom',
  '/.rss',
  '/f.json',
  '/feed.json',
  '/json',
]
