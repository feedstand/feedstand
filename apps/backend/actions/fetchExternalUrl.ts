import axios from 'axios'

export const fetchExternalUrl = async (url: string, init: RequestInit = {}): Promise<Response> => {
    // TODO: Enable caching of requests based on headers in the response.
    const axiosResponse = await axios(url, {
        timeout: 30 * 1000,
        method: init.method,
        headers: init.headers as Record<string, string>,
        data: init.body,
        // Enables lenient HTTP parsing for non-standard server responses where Content-Length or
        // Transfer-Encoding headers might be malformed (common with legacy RSS feeds and
        // misconfigured servers).
        insecureHTTPParser: true,
    })

    return new Response(axiosResponse.data, {
        status: axiosResponse.status,
        statusText: axiosResponse.statusText,
        headers: new Headers(axiosResponse.headers as Record<string, string>),
    })
}
