import { z } from 'zod'

export const fixSuggestion = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('redirect'),
    currentUrl: z.string().url(),
    redirectUrl: z.string().url(),
  }),
  z.object({
    type: z.literal('defunct'),
    currentUrl: z.string().url(),
    alternatives: z.array(
      z.object({
        url: z.string().url(),
        title: z.string(),
      }),
    ),
  }),
])
