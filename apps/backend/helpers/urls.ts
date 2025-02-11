export const isAbsoluteUrl = (url: string): boolean => {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

export const resolveRelativeUrl = (url: string, base: string): string => {
    if (isAbsoluteUrl(url)) {
        return url
    }

    return new URL(url, base).href
}
