import { AxiosRequestConfig } from 'axios'
import { instance as axios } from '../instances/axios'

export const fetchExternalUrl = async (
    url: string,
    config?: AxiosRequestConfig,
): Promise<Response> => {
    const response = await axios(url, config)

    return new Response(response.data, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers as Record<string, string>),
    })
}
