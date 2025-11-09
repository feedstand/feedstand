import { inArray } from 'drizzle-orm'
import type { Opml } from 'feedsmith/types'
import { tables } from '../database/tables.ts'
import { isSafePublicUrl, resolveAbsoluteUrl } from '../helpers/urls.ts'
import { db } from '../instances/database.ts'
import type { Fixable, NewFixable } from '../types/schemas.ts'
import { upsertChannel } from './upsertChannel.ts'

export type SuggestFixes = (opml: Opml.Document<string>) => Promise<Array<Fixable>>

export const suggestFixes: SuggestFixes = async (opml) => {
  const suggestedFixables: Array<NewFixable> = []
  const opmlFeedUrls: Array<string> = []
  const opmlSiteUrls: Map<string, string> = new Map()

  // 1. Collect all the feed and site URLs from the OPML structure for later use.
  for (const outline of opml?.body?.outlines || []) {
    if (outline.xmlUrl) {
      // Validate and transform URL to prevent SSRF attacks
      const resolvedUrl = resolveAbsoluteUrl(outline.xmlUrl)

      if (!isSafePublicUrl(resolvedUrl)) {
        console.warn('[SECURITY] Skipping unsafe URL from OPML:', outline.xmlUrl)
        continue
      }

      opmlFeedUrls.push(resolvedUrl)

      if (outline.htmlUrl) {
        opmlSiteUrls.set(resolvedUrl, outline.htmlUrl)
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
      const { channel } = await upsertChannel({ url: opmlFeedUrl })

      // If the feed exists but under a different URL (the old URL redirects to a new one),
      // include a suggestion to update the URL to the new one.
      if (channel.feedUrl !== opmlFeedUrl) {
        suggestedFixables.push({
          type: 'redirect',
          fromUrl: opmlFeedUrl,
          feedUrl: channel.feedUrl,
          title: channel.title,
          channelId: channel.id,
        })
      }
    } catch {
      // 4. If the feed is not valid, look for fixables looking at both feed and site URLs.
      // TODO: Implement.
    }
  }

  // 5. Proceed with inserting and collecting all the fix suggestions for the OPML.
  const fixables = await db.insert(tables.fixables).values(suggestedFixables).returning()

  return fixables
}
