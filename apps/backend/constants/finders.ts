import { anyFeedContentTypes } from './fetchers.ts'

export const feedLinkSelectors = anyFeedContentTypes.map(
  (contentType) => `link[type*="${contentType}"][rel="alternate"]`,
)

export const youTubeDomains = ['youtu.be', 'youtube.com']

export const ignoredFeedUris = ['wp-json/oembed/', 'wp-json/wp/']

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
  '/?format=rss', // I.e. Squarespace.
  '/?format=atom',
  '/?rss=1', // Textpattern.
  '/?atom=1', // Textpattern.
  // '/?feed=rss', // WordPress - can be skipped as it redirects to /feed, /feed/atom.
  // '/?feed=rss2', // WordPress - can be skipped as it redirects to /feed, /feed/atom.
  // '/?feed=atom', // WordPress - can be skipped as it redirects to /feed, /feed/atom.
  '/.rss', // I.e. Reddit.
  '/f.json',
  '/f.rss',
  '/feed.json',
  '/json',
  '/.feed',
  '/comments/feed', // WordPress.
]
