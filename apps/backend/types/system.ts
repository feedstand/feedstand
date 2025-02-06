import { Channel, FeedInfo } from './schemas'

export type FeedFinder = (
    response: Response,
    options?: {
        channel?: Channel
    },
) => Promise<Array<FeedInfo> | undefined>

export type ValueParser<R, V = unknown> = (value: V) => R | undefined
