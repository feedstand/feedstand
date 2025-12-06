import { customType } from 'drizzle-orm/pg-core'
import { removeNullBytes } from '../../helpers/strings.ts'

export const safeVarchar = customType<{
  data: string
  driverData: string
  config: { length?: number }
}>({
  dataType: (config) => {
    return config?.length ? `varchar(${config.length})` : 'varchar'
  },
  fromDriver: (value: string): string => {
    return value
  },
  toDriver: (value: string): string => {
    return removeNullBytes(value)
  },
})
