import { z } from 'zod'
import { parsedAttachment, parsedAuthor, parsedFeed, parsedHub, parsedItem } from './schemas'

export type ParseLevel = 'strict' | 'skip' | 'coerce'

export type NonStrictParseLevel = Omit<ParseLevel, 'strict'>

export type ParseFunction<T> = (value: unknown, level: NonStrictParseLevel) => T | undefined

export type ParsedAuthor = z.infer<typeof parsedAuthor>

export type ParsedAttachment = z.infer<typeof parsedAttachment>

export type ParsedItem = z.infer<typeof parsedItem>

export type ParsedHub = z.infer<typeof parsedHub>

export type ParsedFeed = z.infer<typeof parsedFeed>
