export const isOneOfContentTypes = (
    contentType: string | null | undefined,
    contentTypesToCheck: Array<string>,
) => {
    return contentType && contentTypesToCheck.some((type) => contentType.includes(type))
}
