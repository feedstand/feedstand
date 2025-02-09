import { fetchUrl } from '../actions/fetchUrl'

export type IsUrlFresh = (
    url: string,
    options: {
        etag?: string
        date?: Date
        // TODO: Consider adding support for Cache-Control and Age headers to detect if
        // the content is still fresh.
    },
) => Promise<{
    isFresh: boolean
    response: Response
}>

export const isUrlFresh: IsUrlFresh = async (url, options) => {
    const response = await fetchUrl(url, {
        method: 'head',
        headers: {
            'If-None-Match': options.etag,
            'If-Modified-Since': options.date ? options.date.toISOString() : undefined,
        },
    })

    return {
        isFresh: response.status === 304,
        response,
    }
}
