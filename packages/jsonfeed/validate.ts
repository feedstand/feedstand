import { strictFeed } from './schemas'

export type Validate = (json: unknown) => {
  isValid: boolean
  errors: Record<string, Array<string>> | undefined
}

export const validate: Validate = (json) => {
  const { success, error } = strictFeed.safeParse(json)

  return {
    isValid: success,
    errors: error?.flatten().fieldErrors,
  }
}
