import { customType } from 'drizzle-orm/pg-core'

export const sanitizedText = customType<{ data: string; driverData: string }>({
    dataType() {
        return 'text'
    },
    fromDriver(value: string): string {
        return value
    },
    toDriver(value: string): string {
        if (typeof value !== 'string') {
            return value
        }

        const string = String(value)

        return string
            .replace(/\0/g, '') // Remove NULL bytes.
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove other problematic characters.
            .replace(/[\uFFFD\uFFFE\uFFFF]/g, '') // Replace invalid UTF-8 sequences.
    },
})
