import { and, eq, inArray, ne } from 'drizzle-orm'
import type { Opml } from 'feedsmith'
import { tables } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import type { Fixable, NewFixable } from '../types/schemas.ts'
import { upsertChannel } from './upsertChannel.ts'

export const suggestFixes = async (opml: Opml): Promise<Array<Fixable>> => {
  // const suggestedFixables: Array<NewFixable> = []
  // const opmlFeedUrls: Array<string> = []
  // const opmlSiteUrls: Map<string, string> = new Map()

  // // 1. Collect all the feed and site URLs from the OPML structure for later use.
  // for (const outline of opml?.body.outlines || []) {
  //   if (outline.xmlUrl) {
  //     opmlFeedUrls.push(outline.xmlUrl)

  //     if (outline.htmlUrl) {
  //       opmlSiteUrls.set(outline.xmlUrl, outline.htmlUrl)
  //     }
  //   }
  // }

  // // 2. Find URLs that exist in the OPML file but are not yet in the database.
  // const existingChannels = await db
  //   .select({ feedUrl: tables.channels.feedUrl })
  //   .from(tables.channels)
  //   .where(inArray(tables.channels.feedUrl, opmlFeedUrls))
  // const existingFeedUrls = new Set(existingChannels.map(({ feedUrl }) => feedUrl))

  // for (const opmlFeedUrl of opmlFeedUrls) {
  //   if (existingFeedUrls.has(opmlFeedUrl)) {
  //     continue
  //   }

  //   try {
  //     // 3. For each non-existent Channel, check if the feed is actually valid.
  //     const channel = await upsertChannel(opmlFeedUrl)

  //     // If the feed exists but under a different URL (the old URL redirects to a new one),
  //     // include a suggestion to update the URL to the new one.
  //     if (channel.feedUrl !== opmlFeedUrl) {
  //       suggestedFixables.push({
  //         type: 'redirect',
  //         fromUrl: opmlFeedUrl,
  //         feedUrl: channel.feedUrl,
  //       })
  //     }
  //   } catch (error) {
  //     // 4. If the feed is not valid, look for fixables looking at both feed and site URLs.
  //   }
  // }

  // 5. Proceed with collecting all the fix suggestions for the OPML.
  // const fixables = await db
  //   .select({
  //     fromUrl: tables.fixables.fromUrl,
  //     feedUrl: tables.fixables.feedUrl,
  //     title: tables.fixables.title,
  //   })
  //   .from(tables.fixables)
  //   .where(
  //   )

  return []
}
