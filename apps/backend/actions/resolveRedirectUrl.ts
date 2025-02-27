import { fetchUrl } from '../actions/fetchUrl'

export const resolveRedirectUrl = async (url: string): Promise<string> => {
  const response = await fetchUrl(url, { method: 'head' })

  return response.url
}
