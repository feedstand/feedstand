import { jsonFeedContentTypes } from '../../constants/parsers'
import { isOneOfContentTypes } from '../../helpers/finders'
import { parseJsonFeedChannel, parseJsonFeedItems } from '../../helpers/parsers'
import { FeedParser } from '../../types/system'

export const extractRedirectUrl = (text: string): string | undefined => {
    const pattern =
        /^This RSS feed has been redirected, and SoundCloud cannot guarantee the safety of external links\. If you would like to continue, you can navigate to ['"]([^'"]+)['"]\.?\s*RSS Readers and Podcasting apps will be redirected automatically\.?$/i
    const match = text.match(pattern)

    return match?.[1]
}

export const soundCloudFeed: FeedParser = async (response, url) => {
    if (url.indexOf('soundcloud.com') === -1) {
        return
    }

    const text = await response.text()
    const redirectUrl = extractRedirectUrl(text)

    console.log({ text, redirectUrl, response })

    if (!redirectUrl) {
        return
    }

    if (!isOneOfContentTypes(response, jsonFeedContentTypes)) {
        return
    }

    // TODO: Validate if the JSON file is actually a JSON Feed.
    const feed = await response.json()

    return {
        channel: parseJsonFeedChannel(feed, url),
        items: parseJsonFeedItems(feed),
    }
}
