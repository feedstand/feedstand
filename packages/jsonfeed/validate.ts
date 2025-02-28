import { ZodError } from 'zod'
import { strictFeed } from './schemas'

export type Validate = (json: unknown) => {
  isValid: boolean
  error: ZodError | undefined
}

export const validate: Validate = (json) => {
  const { success: isValid, error } = strictFeed.safeParse(json)

  return { isValid, error }
}
