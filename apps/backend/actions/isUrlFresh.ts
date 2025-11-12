import { type FetchUrlResponse, fetchUrl } from '../actions/fetchUrl.ts'

export type IsUrlFresh = (
  url: string,
  etag: string | undefined,
  lastModified: string | undefined,
) => Promise<{
  isFresh: boolean
  response: FetchUrlResponse
}>

export const isUrlFresh: IsUrlFresh = async (url, etag, lastModified) => {
  const response = await fetchUrl(url, {
    headers: {
      'If-None-Match': etag,
      'If-Modified-Since': lastModified,
    },
  })

  return {
    isFresh: response.status === 304,
    response,
  }
}
