import { z } from 'zod'

const looseAuthor = z.object({
  name: z.string().optional(),
  url: z.string().optional(),
  avatar: z.string().optional(),
})

const looseAttachment = z.object({
  url: z.string().optional(),
  mime_type: z.string().optional(),
  title: z.string().optional(),
  size_in_bytes: z.number().optional(),
  duration_in_seconds: z.number().optional(),
})

const looseItem = z.object({
  id: z.string().optional(),
  url: z.string().optional(),
  external_url: z.string().optional(),
  title: z.string().optional(),
  content_html: z.string().optional(),
  content_text: z.string().optional(),
  summary: z.string().optional(),
  image: z.string().optional(),
  banner_image: z.string().optional(),
  date_published: z.string().optional(),
  date_modified: z.string().optional(),
  tags: z.array(z.string()).optional(),
  author: looseAuthor.optional(),
  authors: z.array(looseAuthor).optional(),
  language: z.string().optional(),
  attachments: z.array(looseAttachment).optional(),
})

const looseHub = z.object({
  type: z.string().optional(),
  url: z.string().optional(),
})

const looseFeed = z.object({
  version: z.string().optional(),
  title: z.string().optional(),
  home_page_url: z.string().optional(),
  feed_url: z.string().optional(),
  description: z.string().optional(),
  user_comment: z.string().optional(),
  next_url: z.string().optional(),
  icon: z.string().optional(),
  favicon: z.string().optional(),
  language: z.string().optional(),
  expired: z.boolean().optional(),
  hubs: z.array(looseHub).optional(),
  author: looseAuthor.optional(),
  authors: z.array(looseAuthor).optional(),
  items: z.array(looseItem),
})

const strictAuthorCommon = z.object({
  name: z.string(),
  url: z.string().url().optional(),
  avatar: z.string().url().optional(),
})

const strictAttachmentCommon = z.object({
  url: z.string().url(),
  mime_type: z.string(),
  title: z.string().optional(),
  size_in_bytes: z.number().int().optional(),
  duration_in_seconds: z.number().optional(),
})

const strictItemCommon = z.object({
  id: z.string(),
  url: z.string().url().optional(),
  external_url: z.string().url().optional(),
  title: z.string().optional(),
  content_html: z.string().optional(),
  content_text: z.string().optional(),
  summary: z.string().optional(),
  image: z.string().url().optional(),
  banner_image: z.string().url().optional(),
  date_published: z.string().optional(),
  date_modified: z.string().optional(),
  tags: z.array(z.string()).optional(),
  attachments: z.array(strictAttachmentCommon).optional(),
})
// .refine((data) => data.content_html !== undefined || data.content_text !== undefined, {
//   message: 'At least one of content_html or content_text must be provided',
// })

const strictHubCommon = z.object({
  type: z.string(),
  url: z.string().url(),
})

const strictFeedCommon = z.object({
  title: z.string(),
  home_page_url: z.string().url().optional(),
  feed_url: z.string().url().optional(),
  description: z.string().optional(),
  user_comment: z.string().optional(),
  next_url: z.string().url().optional(),
  icon: z.string().url().optional(),
  favicon: z.string().url().optional(),
  expired: z.boolean().optional(),
  hubs: z.array(strictHubCommon).optional(),
})

const strictItem1 = strictItemCommon.extend({
  author: strictAuthorCommon.optional(),
})

const strictFeed1 = strictFeedCommon.extend({
  version: z.literal('https://jsonfeed.org/version/1'),
  author: strictAuthorCommon.optional(),
  items: z.array(strictItem1),
})

const strictItem11 = strictItemCommon.extend({
  authors: z.array(strictAuthorCommon).optional(),
  language: z.string().optional(),
})

const strictFeed11 = strictFeedCommon.extend({
  version: z.literal('https://jsonfeed.org/version/1.1'),
  authors: z.array(strictAuthorCommon).optional(),
  language: z.string().optional(),
  items: z.array(strictItem11),
})

const strictFeed = z.discriminatedUnion('version', [strictFeed1, strictFeed11])

export { looseFeed, strictFeed1, strictFeed11, strictFeed }
