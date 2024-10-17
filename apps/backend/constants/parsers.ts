export const htmlContentTypes = ['text/html', 'application/xhtml+xml']

export const jsonFeedContentTypes = ['application/json']

export const xmlFeedContentTypes = [
    'application/atom+xml',
    'application/rss+xml',
    'application/xml',
    'text/xml',
]

export const anyFeedContentTypes = [...jsonFeedContentTypes, ...xmlFeedContentTypes]
