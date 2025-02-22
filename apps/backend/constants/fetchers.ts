export const maxTimeout = 20 * 1000

export const maxContentSize = 100 * 1024 * 1024

export const avoidedContentTypes = ['audio/', 'video/']

export const htmlContentTypes = ['text/html', 'application/xhtml+xml']

export const jsonFeedContentTypes = ['application/json']

export const xmlFeedContentTypes = [
  'application/rdf+xml',
  'application/rss+xml',
  'application/atom+xml',
  'application/xml', // Not ideal, it should probably be discarded at some point.
  'text/rdf+xml', // Legacy, for supporting very old websites only.
  'text/rss+xml', // Legacy, for supporting very old websites only.
  'text/atom+xml', // Legacy, for supporting very old websites only.
  'text/xml', // Legacy, for supporting very old websites only.
]

export const anyFeedContentTypes = [...jsonFeedContentTypes, ...xmlFeedContentTypes]
