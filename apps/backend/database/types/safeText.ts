import { customType } from 'drizzle-orm/pg-core'
import { removeNullBytes } from '../../helpers/strings'

export const safeText = customType<{ data: string; driverData: string }>({
    dataType: () => {
        return 'text'
    },
    fromDriver: (value: string): string => {
        return value
    },
    toDriver: (value: unknown): string => {
        return removeNullBytes(value)
    },
})
