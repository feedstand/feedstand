import { z } from 'zod'

export const parsedRssAuthor = z
  .object({
    email: z.string(),
    name: z.string(),
    link: z.string(),
  })
  .partial()

export const parsedRssCategory = z
  .object({
    label: z.string(),
    term: z.string(),
    link: z.string(),
  })
  .partial()

export const parsedRssEnclosure = z
  .object({
    url: z.string(),
    length: z.coerce.number().catch(0),
    type: z.string(),
  })
  .partial()

export const parsedRssImage = z
  .object({
    description: z.string(),
    height: z.coerce.number().catch(0),
    link: z.string(),
    title: z.string(),
    url: z.string(),
    width: z.coerce.number().catch(0),
  })
  .partial()

export const parsedRssItemMedia = z
  .object({
    image: z.string(),
    length: z.coerce.number().catch(0),
    mimetype: z.string(),
    title: z.string(),
    type: z.string(),
    link: z.string(),
  })
  .partial()

export const parsedRssItem = z
  .object({
    authors: z.array(parsedRssAuthor),
    categories: z.array(parsedRssCategory),
    content: z.string(),
    description: z.string(),
    id: z.string(),
    enclosure: parsedRssEnclosure,
    image: parsedRssImage,
    link: z.string(),
    media: z.array(parsedRssItemMedia),
    publishedAt: z.string(),
    title: z.string(),
    updatedAt: z.string(),
  })
  .partial()

export const parsedRss = z
  .object({
    authors: z.array(parsedRssAuthor),
    categories: z.array(parsedRssCategory),
    copyright: z.string(),
    description: z.string(),
    generator: z.string(),
    image: parsedRssImage,
    items: z.array(parsedRssItem),
    language: z.string(),
    link: z.string(),
    publishedAt: z.string(),
    self: z.string(),
    title: z.string(),
    updatedAt: z.string(),
    version: z.string(),
    // TODO: Add more items from RSS specification: managingEditor, docs, skipDays, skipHours, ttl, webMaster.
  })
  .partial()
