export const textStandard = (value: unknown) => {
    // INFO: This is a temporary measure to detect any non-standard values for fields in feeds.
    if (typeof value !== 'string' && value !== null && value !== undefined) {
        console.log('textStandard', { value })
    }

    if (typeof value !== 'string') {
        return
    }

    return value
}
