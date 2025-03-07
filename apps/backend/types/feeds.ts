import RSSParser from 'rss-parser'

export type XmlFeed = Awaited<ReturnType<InstanceType<typeof RSSParser>['parseString']>>
