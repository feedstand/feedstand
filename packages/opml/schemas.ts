import { z } from 'zod'
import { LooseOpmlOutline } from './types'

export const looseOpmlOutline: z.ZodType<LooseOpmlOutline> = z.lazy(() =>
  z.object({ outline: z.array(looseOpmlOutline).optional() }).catchall(z.string().optional()),
)

export const looseOpml = z.object({
  version: z.string(),
  head: z.record(z.string(), z.string()),
  body: z.object({
    outline: z.array(looseOpmlOutline),
  }),
})

export const strictOpml10 = z.object({
  version: z.literal('1.0'),
})

export const strictOpml11 = z.object({
  version: z.literal('1.1'),
})

const strictOpml20OutlineBase = z.object({
  text: z.string(),
  created: z.string().optional(),
  isComment: z.string().optional(),
  isBreakpoint: z.string().optional(),
  category: z.string().optional(),
})

const strictOpml20OutlineRss = strictOpml20OutlineBase.extend({
  type: z.literal('rss'),
  xmlUrl: z.string(),
  description: z.string().optional(),
  htmlUrl: z.string().optional(),
  language: z.string().optional(),
  title: z.string().optional(),
  version: z.enum(['RSS', 'RSS1', 'RSS2', 'scriptingNews']).optional(),
})

const strictOpml20OutlineLink = strictOpml20OutlineBase.extend({
  type: z.literal('link'),
  url: z.string(),
})

const strictOpml20OutlineInclude = strictOpml20OutlineBase.extend({
  type: z.literal('include'),
  url: z.string(),
})

export const strictOpml20Outline = z.discriminatedUnion('type', [
  strictOpml20OutlineRss,
  strictOpml20OutlineLink,
  strictOpml20OutlineInclude,
])

export const strictOpml20 = z.object({
  version: z.literal('2.0'),
  head: z.object({
    title: z.string().optional(),
    dateCreated: z
      .string()
      .transform((value) => new Date(value))
      .optional(),
    dateModified: z
      .string()
      .transform((value) => new Date(value))
      .optional(),
    ownerName: z.string().optional(),
    ownerEmail: z.string().optional(),
    ownerId: z.string().optional(),
    docs: z.string().optional(),
    expansionState: z.string().optional(),
    vertScrollState: z.coerce.number().optional(),
    windowTop: z.coerce.number().optional(),
    windowLeft: z.coerce.number().optional(),
    windowBottom: z.coerce.number().optional(),
    windowRight: z.coerce.number().optional(),
  }),
  body: z.object({
    outline: z.array(strictOpml20Outline),
  }),
})

export const strictOpml = z.discriminatedUnion('version', [
  strictOpml10,
  strictOpml11,
  strictOpml20,
])
