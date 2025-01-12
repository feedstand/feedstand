import { openapi } from '../instances/openapi'

export const loadChannel = async (channelId: number) => {
    const request = await openapi.channels[':id'].$get({ param: { id: channelId } })
    const response = await request.json()

    return response
}
