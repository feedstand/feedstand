export const isOneOfContentTypes = (response: Response, contentTypesToCheck: Array<string>) => {
    return contentTypesToCheck.some((type) => response.headers.get('content-type')?.includes(type))
}

export const extractValueByRegex = async (
    response: Response,
    regex: RegExp,
    matchIndex = 0,
): Promise<string | false> => {
    const reader = response.body?.getReader()

    if (!reader) {
        return false
    }

    while (true) {
        const { done, value } = await reader.read()

        if (done) {
            break
        }

        const chunk = new TextDecoder().decode(value)
        const match = chunk.match(regex)

        if (match) {
            return match[matchIndex]
        }
    }

    return false
}
