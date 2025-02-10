import { z } from 'zod'

export const foundFeeds = z.object({
    etag: z.string().nullable(),
    feeds: z.array(
        z.object({
            url: z.string().url(),
            title: z.string().nullable().optional(),
        }),
    ),
})
