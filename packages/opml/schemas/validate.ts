import { z } from 'zod'

export const validatedOpml10Head = z.object({
  title: z.string().optional(),
  dateCreated: z.string().optional(),
  dateModified: z.string().optional(),
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
})

export const validatedOpml10Outline = z.object({
  text: z.string().optional(),
  type: z.string().optional(),
  isComment: z.enum(['true', 'false']).optional(),
  isBreakpoint: z.enum(['true', 'false']).optional(),
})

export const validatedOpml10 = z.object({
  version: z.literal('1.0'),
  head: validatedOpml10Head,
  body: z.object({
    outline: z.array(validatedOpml10Outline),
  }),
})

export const validatedOpml11Outline = validatedOpml10Outline

export const validatedOpml11Head = validatedOpml10Head

export const validatedOpml11 = z.object({
  version: z.literal('1.1'),
  head: validatedOpml11Head,
  body: z.object({
    outline: z.array(validatedOpml11Outline),
  }),
})

const validatedOpml20OutlineBase = z.object({
  text: z.string(),
  created: z.string().optional(),
  isComment: z.string().optional(),
  isBreakpoint: z.string().optional(),
  category: z.string().optional(),
})

const validatedOpml20OutlineUntyped = validatedOpml20OutlineBase.extend({
  type: z.string().optional(),
  url: z.string().optional(),
  xmlUrl: z.string().optional(),
  description: z.string().optional(),
  htmlUrl: z.string().optional(),
  language: z.string().optional(),
  title: z.string().optional(),
  version: z.string().optional(),
})

const validatedOpml20OutlineRss = validatedOpml20OutlineBase.extend({
  type: z.literal('rss'),
  xmlUrl: z.string(),
  description: z.string().optional(),
  htmlUrl: z.string().optional(),
  language: z.string().optional(),
  title: z.string().optional(),
  version: z.enum(['RSS', 'RSS1', 'RSS2', 'scriptingNews']).optional(),
})

const validatedOpml20OutlineLink = validatedOpml20OutlineBase.extend({
  type: z.literal('link'),
  url: z.string(),
})

const validatedOpml20OutlineInclude = validatedOpml20OutlineBase.extend({
  type: z.literal('include'),
  url: z.string(),
})

export const validatedOpml20Outline = z.union([
  validatedOpml20OutlineUntyped,
  z.discriminatedUnion('type', [
    validatedOpml20OutlineRss,
    validatedOpml20OutlineLink,
    validatedOpml20OutlineInclude,
  ]),
])

export const validatedOpml20Head = z.object({
  title: z.string().optional(),
  dateCreated: z.string().optional(),
  dateModified: z.string().optional(),
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
})

export const validatedOpml20 = z.object({
  version: z.literal('2.0'),
  head: validatedOpml20Head,
  body: z.object({
    outline: z.array(validatedOpml20Outline),
  }),
})

export const validatedOpml = z.discriminatedUnion('version', [
  validatedOpml10,
  validatedOpml11,
  validatedOpml20,
])
