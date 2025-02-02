import { customType } from 'drizzle-orm/pg-core'
import { removeNullBytes } from '../../helpers/strings'

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
    toDriver: (value: unknown): string => {
        return removeNullBytes(value)
    },
})
