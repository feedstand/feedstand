export const removeNullBytes = (value: unknown): string => {
    return String(value).replace(/\0/g, '')
}

export const isJson = (value: string): boolean => {
    return (
        (value.startsWith('{') && value.endsWith('}')) ||
        (value.startsWith('[') && value.endsWith(']'))
    )
}
