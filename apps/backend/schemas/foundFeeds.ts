import { z } from 'zod'

export const foundFeeds = z.object({
  meta: z.object({
    etag: z.string().nullable(),
    hash: z.string().optional(),
  }),
  feeds: z.array(
    z.object({
      url: z.string().url(),
      title: z.string().nullable().optional(),
    }),
  ),
})
