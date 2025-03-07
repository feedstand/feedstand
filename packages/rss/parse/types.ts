import z from 'zod'
import {
  parsedRss,
  parsedRssAuthor,
  parsedRssCategory,
  parsedRssEnclosure,
  parsedRssImage,
  parsedRssItem,
  parsedRssItemMedia,
} from './schemas'

export type ParsedRssAuthor = z.infer<typeof parsedRssAuthor>

export type ParsedRssCategory = z.infer<typeof parsedRssCategory>

export type ParsedRssEnclosure = z.infer<typeof parsedRssEnclosure>

export type ParsedRssImage = z.infer<typeof parsedRssImage>

export type ParsedRssItemMedia = z.infer<typeof parsedRssItemMedia>

export type ParsedRssItem = z.infer<typeof parsedRssItem>

export type ParsedRss = z.infer<typeof parsedRss>
