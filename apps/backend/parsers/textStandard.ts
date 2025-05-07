import type { ValueParser } from '../types/system.ts'

export const textStandard: ValueParser<string> = (value) => {
  if (typeof value !== 'string') {
    return
  }

  return value
}
