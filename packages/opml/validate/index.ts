import type { ZodError } from 'zod'
import { parser } from '../common'
import { validatedOpml } from './schemas'

export type Validate = (xml: string) => {
  isValid: boolean
  error: ZodError | undefined
}

export const validate: Validate = (xml) => {
  const input = parser.parse(xml).opml
  const { success: isValid, error } = validatedOpml.safeParse(input)

  return { isValid, error }
}
