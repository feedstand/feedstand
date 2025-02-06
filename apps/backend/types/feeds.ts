import RSSParser from 'rss-parser'

export type JsonFeed = ReturnType<typeof JSON.parse>

export type XmlFeed = Awaited<ReturnType<InstanceType<typeof RSSParser>['parseString']>>
