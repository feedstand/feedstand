import { z } from 'zod'
import { parsedAttachment, parsedAuthor, parsedFeed, parsedHub, parsedItem } from './schemas/parse'
import {
  validatedItemContent,
  validatedItem1,
  validatedFeed1,
  validatedItem11,
  validatedFeed11,
  validatedFeed,
} from './schemas/validate'

export type ParsedAuthor = z.infer<typeof parsedAuthor>

export type ParsedAttachment = z.infer<typeof parsedAttachment>

export type ParsedItem = z.infer<typeof parsedItem>

export type ParsedHub = z.infer<typeof parsedHub>

export type ParsedFeed = z.infer<typeof parsedFeed>

export type ValidatedItemContent = z.infer<typeof validatedItemContent>

export type ValidatedItem1 = z.infer<typeof validatedItem1>

export type ValidatedFeed1 = z.infer<typeof validatedFeed1>

export type ValidatedItem11 = z.infer<typeof validatedItem11>

export type ValidatedFeed11 = z.infer<typeof validatedFeed11>

export type ValidatedFeed = z.infer<typeof validatedFeed>
