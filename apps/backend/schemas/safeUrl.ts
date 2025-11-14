import { z } from 'zod'
import { prepareUrl } from '../helpers/urls.ts'

export const safeUrl = z
  .url()
  .transform((url) => prepareUrl(url, { validate: true }))
  .refine((url) => url, { message: 'Invalid URL' })
  .transform((url) => url as string)
