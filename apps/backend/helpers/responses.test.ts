import { describe, expect, it } from 'vitest'
import { extractValueByRegex, isOneOfContentTypes } from './responses.ts'

describe('isOneOfContentTypes', () => {
  const mockResponse: Response = new Response(null, {
    headers: new Headers({
      'content-type': 'application/json; charset=utf-8',
    }),
  })

  it('should return true when content-type matches one of the types', () => {
    const result = isOneOfContentTypes(mockResponse, ['application/json'])

    expect(result).toBe(true)
  })

  it('should return true when content-type partially matches', () => {
    const result = isOneOfContentTypes(mockResponse, ['application/json', 'text/plain'])

    expect(result).toBe(true)
  })

  it('should return false when content-type does not match', () => {
    const result = isOneOfContentTypes(mockResponse, ['text/plain'])

    expect(result).toBe(false)
  })

  it('should return false when content-type header is missing', () => {
    const responseWithoutContentType = new Response(null)
    const result = isOneOfContentTypes(responseWithoutContentType, ['application/json'])

    expect(result).toBe(false)
  })

  it('should return true when string-based content-type matches', () => {
    const result = isOneOfContentTypes('application/json', ['application/json'])

    expect(result).toBe(true)
  })

  it('should handle case-insensitive content-type matching', () => {
    const upperCaseResponse = new Response(null, {
      headers: new Headers({
        'content-type': 'APPLICATION/RSS+XML',
      }),
    })

    expect(isOneOfContentTypes(upperCaseResponse, ['application/rss+xml'])).toBe(true)
    expect(isOneOfContentTypes('APPLICATION/ATOM+XML', ['application/atom+xml'])).toBe(true)
    expect(isOneOfContentTypes('Application/Json', ['application/json'])).toBe(true)
  })
})

describe('extractValueByRegex', () => {
  it('should extract value using regex with default match index', async () => {
    const response = new Response('Hello World 123')
    const regex = /World \d+/
    const result = await extractValueByRegex(response, regex)

    expect(result).toBe('World 123')
  })

  it('should extract value using regex', async () => {
    const response = new Response('Hello World 123')
    const regex = /World (\d+)/
    const result = await extractValueByRegex(response, regex, { matchIndex: 1 })

    expect(result).toBe('123')
  })

  it('should return false when no match is found', async () => {
    const response = new Response('Hello World')
    const regex = /(\d+)/
    const result = await extractValueByRegex(response, regex)

    expect(result).toBe(false)
  })

  it('should handle empty response body', async () => {
    const response = new Response(null)
    const regex = /test/
    const result = await extractValueByRegex(response, regex)

    expect(result).toBe(false)
  })

  it('should handle large content with chunk overlap', async () => {
    const longContent = 'a'.repeat(2000) + 'target123' + 'b'.repeat(2000)
    const response = new Response(longContent)
    const regex = /target(\d+)/
    const result = await extractValueByRegex(response, regex, {
      matchIndex: 1,
      chunkOverlap: 1000,
    })

    expect(result).toBe('123')
  })

  it('should handle regex with multiple capture groups', async () => {
    const response = new Response('Hello World 123')
    const regex = /(World) (\d+)/
    const result = await extractValueByRegex(response, regex, { matchIndex: 2 })

    expect(result).toBe('123')
  })
})
