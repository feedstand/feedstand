import { Agent, fetch } from 'undici'
import { FetchFeedFetcher } from '../actions/fetchFeed'
import { maxTimeout } from '../constants/fetchers'

export const nativeFetchUncompressed: FetchFeedFetcher = async (context, next) => {
    if (context.response?.ok) {
        return await next()
    }

    try {
        // TODO: Enable caching of requests based on headers in the response.
        const response = await fetch(context.url, {
            signal: AbortSignal.timeout(maxTimeout),
            headers: {
                // Tell the server to give the uncompressed data. This is to mitigate issues where
                // some servers wrongly say they the response is gzipped where in reality it's not.
                'Accept-Encoding': 'identity',
            },
            dispatcher: new Agent({
                // Allows getting RSS feed from URLs with unverified certificate.
                connect: { rejectUnauthorized: false },
                // Set max header size to 64KB for those responses with a lengthy headers.
                maxHeaderSize: 65536,
            }),
        })

        const bodyBuffer = await response.arrayBuffer()
        const body: BodyInit = Buffer.from(bodyBuffer)
        const headers = new Headers()
        for (const [name, value] of response.headers) {
            headers.set(name, value)
        }

        // TODO: Figure out how to get rid of converting the Undici Response to native one.
        context.response = new Response(body, {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(headers),
        })
    } catch (error) {
        context.error = error
    }

    await next()
}
