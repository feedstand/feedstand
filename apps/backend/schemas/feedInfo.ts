import { z } from 'zod'

export const feedInfo = z.object({
    url: z.string().url(),
    title: z.string().nullable().optional(),
})
