export const textStandard = (value: unknown): string | undefined => {
    if (typeof value !== 'string') {
        return
    }

    return value
}
