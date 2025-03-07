import { ParsedRssAuthor, ParsedRssEnclosure, ParsedRssImage, ParsedRssItem } from './types'

export const isObject = (value: unknown): value is Record<string, any> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof RegExp)
  )
}

export const getFirstPropValue = (object: any, props: Array<string>): any => {
  if (!isObject(object)) {
    return
  }

  const recordLowerKeys = new Map<string, string>()

  for (const key in object) {
    recordLowerKeys.set(key.toLowerCase(), key)
  }

  for (const prop of props) {
    const lowerProp = prop.toLowerCase()
    const actualKey = recordLowerKeys.get(lowerProp)

    if (actualKey !== undefined && Object.hasOwn(object, actualKey)) {
      return object[actualKey]
    }
  }
}

export const retrieveSelf = (object: any): string | undefined => {
  const atomLinks = object?.['atom:link']

  if (!Array.isArray(atomLinks)) {
    return
  }

  for (const atomLink of atomLinks) {
    if (atomLink?.rel === 'self') {
      return atomLink?.href ?? undefined
    }
  }
}

const publishedProps = [
  'pubDate', // RSS.
  'published', // Atom 1.0.
  'atom:published', // Atom 1.0.
  'a10:published', // Atom 1.0.
  'issued', // Atom 0.3 (predecessor to published).
  'atom:issued', // Atom 0.3 (predecessor to published).
  'dc:created', // Dublin Core.
  'dc:issued', // Dublin Core.
  'dcterms:created', // Dublin Core Terms.
  'dcterms:issued', // Dublin Core Terms.
  'media:pubDate', // Media & iTunes.
  'itunes:pubDate', // Media & iTunes.
  // TODO: Add more formats if necessary based on data from feeds.
]

export const retrievePublishedAt = (object: any): string | undefined => {
  return getFirstPropValue(object, publishedProps)?.['#text']
}

const updatedProps = [
  'lastBuildDate', // RSS.
  'updated', // Atom 1.0.
  'atom:updated', // Atom 1.0.
  'a10:updated', // Atom 1.0.
  'modified', // Atom 0.3 (predecessor to updated).
  'atom:modified', // Atom 0.3 (predecessor to updated).
  'dc:modified', // Dublin Core.
  'dcterms:modified', // Dublin Core Terms.
  'rdf:modified', // RDF.
  'content:modified', // Content.
  'media:updated', // Media.
  'itunes:updated', // iTunes.
  // TODO: Add more formats if necessary based on data from feeds.
]

export const retrieveUpdatedAt = (object: any): string | undefined => {
  return getFirstPropValue(object, updatedProps)?.['#text']
}

export const retrieveEnclosure = (object: any): ParsedRssEnclosure | undefined => {
  if (!isObject(object?.enclosure)) {
    return
  }

  return {
    url: object.enclosure?.url?.['#text'],
    length: object.enclosure?.length?.['#text'],
    type: object.enclosure?.type?.['#text'],
  }
}

export const retrieveImage = (object: any): ParsedRssImage | undefined => {
  if (!isObject(object?.image)) {
    return
  }

  return {
    description: object.image?.description?.['#text'],
    height: object.image?.height?.['#text'],
    link: object.image?.link?.['#text'],
    title: object.image?.title?.['#text'],
    url: object.image?.url?.['#text'],
    width: object.image?.width?.['#text'],
  }
}

export const retrieveAuthors = (object: any): Array<ParsedRssAuthor> | undefined => {
  const authors: Array<ParsedRssAuthor> = []
  const rssAuthors = object?.author || []
  const itunesAuthors = object?.['itunes:author'] || []

  for (const rssAuthor of rssAuthors) {
    if (!isObject(rssAuthor)) {
      continue
    }

    authors.push({
      email: rssAuthor.email?.['#text'],
      link: rssAuthor.link?.['#text'],
      name: rssAuthor.name?.['#text'],
    })
  }

  // TODO: Add atom authors here?

  for (const itunesAuthor of itunesAuthors) {
    const name = itunesAuthor?.['#text']

    if (name) {
      authors.push({ name })
    }
  }

  return authors
}

export const retrieveItem = (object: any): ParsedRssItem | undefined => {
  if (!isObject(object)) {
    return
  }

  return {
    authors: retrieveAuthors(object),
    // TODO: Add categories.
    content: object?.content?.['#text'],
    description: object?.description?.['#text'],
    id: object?.guid?.['#text'],
    enclosure: retrieveEnclosure(object),
    image: retrieveImage(object),
    link: object?.link?.['#text'],
    // TODO: Add media.
    publishedAt: retrievePublishedAt(object),
    title: object?.title?.['#text'],
    updatedAt: retrieveUpdatedAt(object),
  }
}

export const retrieveItems = (object: any): Array<ParsedRssItem> | undefined => {
  if (!Array.isArray(object?.item)) {
    return
  }

  return object?.item?.map(retrieveItem)
}
