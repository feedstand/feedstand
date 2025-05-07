import { type DateArg, isValid, toDate } from 'date-fns'
import type { ValueParser } from '../types/system.ts'

export const dateStandard: ValueParser<Date, DateArg<Date> | null | undefined> = (value) => {
  if (!value) {
    return
  }

  const date = toDate(value)

  const isDateValid = isValid(date)
  const isYearValid = date.getFullYear() <= 9999

  return isDateValid && isYearValid ? date : undefined
}
