import { fetchFeed, FetchFeedProcessor } from '../../actions/fetchFeed'

// Details: https://help.soundcloud.com/hc/en-us/articles/115003564088.
export const extractRedirectUrl = (text: string): string | undefined => {
    const pattern =
        /^This RSS feed has been redirected, and SoundCloud cannot guarantee the safety of external links\. If you would like to continue, you can navigate to ['"]([^'"]+)['"]\.?\s*RSS Readers and Podcasting apps will be redirected automatically\.?$/i
    const match = text.match(pattern)

    return match?.[1]
}

export const soundCloudFeed: FetchFeedProcessor = async (context, next) => {
    if (!context.response?.ok || context.response.url.indexOf('soundcloud.com') === -1) {
        return await next()
    }

    const text = await context.response.clone().text()
    const redirectUrl = extractRedirectUrl(text)

    if (!redirectUrl) {
        return await next()
    }

    // TODO: Channels could be merged if channel with URL of the redirect already exists.
    // This would mean that all references to current channel (the one with SoundCloud redirect)
    // would need to be adjusted and assigned to the existing one.

    context.result = await fetchFeed({ url: redirectUrl, channel: context.channel })

    await next()
}
