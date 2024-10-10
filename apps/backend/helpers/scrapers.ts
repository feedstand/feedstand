export const isOneOfContentTypes = (response: Response, contentTypesToCheck: Array<string>) => {
    return contentTypesToCheck.some((type) => response.headers.get('content-type')?.includes(type))
}
