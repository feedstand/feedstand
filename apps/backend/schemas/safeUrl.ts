import { z } from 'zod'
import { isSafePublicUrl, resolveAbsoluteUrl } from '../helpers/urls.ts'

export const safeUrl = z.url().transform(resolveAbsoluteUrl).refine(isSafePublicUrl, {
  message: 'Invalid URL',
})
