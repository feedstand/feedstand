import { fetchFeed, FetchFeedFetcher } from '../actions/fetchFeed'

export const extractRedirectUrl = (text: string): string | undefined => {
    const pattern =
        /^This RSS feed has been redirected, and SoundCloud cannot guarantee the safety of external links\. If you would like to continue, you can navigate to ['"]([^'"]+)['"]\.?\s*RSS Readers and Podcasting apps will be redirected automatically\.?$/i
    const match = text.match(pattern)

    return match?.[1]
}

export const soundCloudFeed: FetchFeedFetcher = async (context, next) => {
    const response = context.response?.clone()

    if (!response?.ok || response.url.indexOf('soundcloud.com') === -1) {
        return await next()
    }

    const text = await response.text()
    const redirectUrl = extractRedirectUrl(text)

    if (!redirectUrl) {
        return await next()
    }

    // TODO: Channels could be merged if channel with URL of the redirect already exists.
    // This would mean that all references to current channel (the one with SoundCloud redirect)
    // would need to be adjusted and assigned to the existing one.

    context.feed = await fetchFeed(redirectUrl, { channel: context.channel })

    await next()
}
