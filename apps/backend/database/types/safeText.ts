import { customType } from 'drizzle-orm/pg-core'
import { removeNullBytes } from '../../helpers/strings.ts'

export const safeText = customType<{ data: string; driverData: string }>({
  dataType: () => {
    return 'text'
  },
  fromDriver: (value: string): string => {
    return value
  },
  toDriver: (value: string): string => {
    return removeNullBytes(value)
  },
})
