export const fetchExternalUrl = async (url: string, init: RequestInit = {}): Promise<Response> => {
    init.signal ||= AbortSignal.timeout(30 * 1000)

    // TODO: Enable caching of requests based on headers in the response.
    const response = await fetch(url, init)

    if (!response.ok) {
        throw Error(`HTTP status code ${response.status}`)
    }

    return response
}
