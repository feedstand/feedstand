export const fetchExternalUrl = async (url: string): Promise<Response> => {
    // TODO: Enable caching of requests based on headers in the response.
    return await fetch(url)
}
