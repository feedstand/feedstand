import { z } from 'zod'
import type { ParsedOpmlOutline } from '../types'

const boolean = z.any().pipe(
  z.any().transform((value) => {
    if (value?.toString().toLowerCase() === 'true') return true
    if (value?.toString().toLowerCase() === 'false') return false
    return !!value
  }),
)

export const parsedOpmlOutline: z.ZodType<ParsedOpmlOutline> = z.lazy(() => {
  return z
    .object({
      text: z.string(),
      type: z.string(),
      isComment: boolean,
      isBreakpoint: boolean,
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
    vertScrollState: z.coerce.number().catch(0),
    windowTop: z.coerce.number().catch(0),
    windowLeft: z.coerce.number().catch(0),
    windowBottom: z.coerce.number().catch(0),
    windowRight: z.coerce.number().catch(0),
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
