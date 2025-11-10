import { type FetchUrlResponse, fetchUrl } from '../actions/fetchUrl.ts'

export type IsUrlFresh = (
  url: string,
  etag: string | undefined,
  date: Date | undefined,
) => Promise<{
  isFresh: boolean
  response: FetchUrlResponse
}>

export const isUrlFresh: IsUrlFresh = async (url, etag, date) => {
  const response = await fetchUrl(url, {
    method: 'head',
    headers: {
      'If-None-Match': etag,
      'If-Modified-Since': date ? date.toISOString() : undefined,
    },
  })

  return {
    isFresh: response.status === 304,
    response,
  }
}
