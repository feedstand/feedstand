import { FeedData, FeedInfo } from './schemas'

export type FeedFinder = (response: Response, url: string) => Promise<Array<FeedInfo> | undefined>

export type FeedParser = (response: Response, url: string) => Promise<FeedData>

export type ValueParser = () => void
