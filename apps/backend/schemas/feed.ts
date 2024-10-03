import { z } from 'zod'

export const feed = z.object({
    url: z.string().url(),
    title: z.string(),
})
