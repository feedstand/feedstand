import { fetchFeed } from '../../actions/fetchFeed'
import { FindFeedsProcessor } from '../../actions/findFeeds'

export const directFinder: FindFeedsProcessor = async (context, next) => {
    if (!context.response?.ok) {
        return await next()
    }

    try {
        const feedData = await fetchFeed({
            url: context.response.url,
            response: context.response,
            channel: context.channel,
        })

        context.result = [{ title: feedData.channel.title, url: feedData.channel.feedUrl }]
    } catch (error) {
        context.error = error
    }

    await next()
}
