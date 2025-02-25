import { LooseOpml } from '@feedstand/opml/types'
import { and, eq, inArray, ne } from 'drizzle-orm'
import { tables } from '../database/tables'
import { db } from '../instances/database'
import { fixChannel } from '../jobs/fixChannel'
import { FixSuggestion } from '../types/schemas'
import { fetchOrCreateChannel } from './fetchOrCreateChannel'

export const suggestFixes = async (opml: LooseOpml): Promise<Array<FixSuggestion>> => {
  const fixSuggestions: Array<FixSuggestion> = []
  const opmlFeedUrls: Array<string> = []
  const opmlSiteUrls: Map<string, string> = new Map()

  // 1. Collect all the feed and site URLs from the OPML structure for later use.
  for (const outline of opml.body.outline) {
    if (outline.xmlUrl) {
      opmlFeedUrls.push(outline.xmlUrl)

      if (outline.htmlUrl) {
        opmlSiteUrls.set(outline.xmlUrl, outline.htmlUrl)
      }
    }
  }

  // 2. Find URLs that exist in the OPML file but are not yet in the database.
  const existingChannels = await db
    .select({ feedUrl: tables.channels.feedUrl })
    .from(tables.channels)
    .where(inArray(tables.channels.feedUrl, opmlFeedUrls))
  const existingFeedUrls = new Set(existingChannels.map(({ feedUrl }) => feedUrl))

  for (const opmlFeedUrl of opmlFeedUrls) {
    if (existingFeedUrls.has(opmlFeedUrl)) {
      continue
    }

    try {
      // 3. For each non-existent Channel, check if the feed is actually valid.
      const channel = await fetchOrCreateChannel(opmlFeedUrl)

      // If the feed exists but under a different URL (the old URL redirects to a new one),
      // include a suggestion to update the URL to the new one.
      if (channel.feedUrl !== opmlFeedUrl) {
        fixSuggestions.push({
          type: 'redirect',
          currentUrl: opmlFeedUrl,
          redirectUrl: channel.feedUrl,
        })
      }
    } catch (error) {
      // 4. If the feed is not valid, look for fixables looking at both feed and site URLs.
      const [defunctChannel] = await db
        .insert(tables.channels)
        .values({
          feedUrl: opmlFeedUrl,
          siteUrl: opmlSiteUrls.get(opmlFeedUrl),
        })
        .returning()

      await fixChannel(defunctChannel)
    }
  }

  // 5. Proceed with collecting all the fix suggestions for the OPML.
  const fixables = await db
    .select({
      channelFeedUrl: tables.channels.feedUrl,
      channelSiteUrl: tables.channels.siteUrl,
      fixableFeedUrl: tables.fixables.feedUrl,
      fixableTitle: tables.fixables.title,
    })
    .from(tables.fixables)
    .innerJoin(tables.channels, eq(tables.fixables.channelId, tables.channels.id))
    .where(
      and(
        inArray(tables.channels.feedUrl, opmlFeedUrls),
        eq(tables.channels.lastScanStatus, 'failed'),
        ne(tables.channels.feedUrl, tables.fixables.feedUrl),
      ),
    )

  return fixSuggestions
}
