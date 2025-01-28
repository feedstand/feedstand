export const removeNullBytes = (value: unknown): string => {
    return String(value).replace(/\0/g, '')
}
