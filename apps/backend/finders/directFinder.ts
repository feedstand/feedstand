import { fetchFeed } from '../actions/fetchFeed'
import { FindFeedsMiddleware } from '../actions/findFeeds'

export const directFinder: FindFeedsMiddleware = async (context, next) => {
    if (!context.response?.ok) {
        return await next()
    }

    try {
        const feedData = await fetchFeed({
            url: context.response.url,
            response: context.response,
            channel: context.channel,
        })

        context.feedInfos = [{ title: feedData.channel.title, url: feedData.channel.url }]
    } catch (error) {
        context.error = error
    }

    await next()
}
