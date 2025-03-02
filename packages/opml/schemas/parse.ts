import { z } from 'zod'
import type { ParsedOpmlOutline } from '../types'

export const parsedOpmlOutline: z.ZodType<ParsedOpmlOutline> = z.lazy(() => {
  return z
    .object({
      text: z.string(),
      type: z.string(),
      isComment: z.coerce.boolean(),
      isBreakpoint: z.coerce.boolean(),
      created: z.string(),
      category: z.string(),
      description: z.string(),
      xmlUrl: z.string(),
      htmlUrl: z.string(),
      language: z.string(),
      title: z.string(),
      version: z.string(),
      url: z.string(),
      outline: z.array(parsedOpmlOutline).optional(),
    })
    .partial()
})

export const parsedOpmlHead = z
  .object({
    title: z.string(),
    dateCreated: z.string(),
    dateModified: z.string(),
    ownerName: z.string(),
    ownerEmail: z.string(),
    ownerId: z.string(),
    docs: z.string(),
    expansionState: z.string(),
    vertScrollState: z.coerce.number(),
    windowTop: z.coerce.number(),
    windowLeft: z.coerce.number(),
    windowBottom: z.coerce.number(),
    windowRight: z.coerce.number(),
  })
  .partial()

export const parsedOpml = z
  .object({
    version: z.string().optional(),
    head: parsedOpmlHead,
    body: z.object({
      outline: z.array(parsedOpmlOutline),
    }),
  })
  .optional()
