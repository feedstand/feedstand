import { AxiosResponse, isAxiosError } from 'axios'
import { FeedFetcher } from '../types/system'

const matchCloudflareError = (response: AxiosResponse, text: string, code: number) => {
    return response?.status === code && (response?.data || '').indexOf(text) !== -1
}

export const cloudflareFetch: FeedFetcher = async (_url, options) => {
    // TODO: Look for a solution to the Cloudflare blocking automatic feed fetching.
    // Example of a feed causing problems: https://www.viovet.co.uk/blog.rss. Related links:
    // - https://openrss.org/issue/144
    // - https://developers.cloudflare.com/bots/reference/verified-bots-policy/
    // - https://radar.cloudflare.com/traffic/verified-bots

    if (isAxiosError(options?.lastError) && options.lastError.response) {
        const response = options.lastError.response

        if (matchCloudflareError(response, '<title>Just a moment...</title>', 403)) {
            throw new Error('Cloudflare blocked site', { cause: options.lastError.response })
        }

        if (matchCloudflareError(response, 'Invalid SSL certificate', 526)) {
            throw new Error('Invalid SSL certificate', { cause: options.lastError.response })
        }

        if (matchCloudflareError(response, 'Error 1033', 530)) {
            throw new Error('Cloudflare Tunnel error', { cause: options.lastError.response })
        }
    }

    throw options?.lastError
}
