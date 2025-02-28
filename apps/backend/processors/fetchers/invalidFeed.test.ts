import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkflowContext } from '../../actions/createWorkflow'
import { FeedData } from '../../types/schemas'
import { invalidFeed } from './invalidFeed'

describe('invalidFeed processor', () => {
  const next = vi.fn()
  const baseContext: WorkflowContext<FeedData> = {
    url: 'https://example.com',
    response: new Response(),
  }

  beforeEach(() => {
    next.mockClear()
  })

  it('should pass through when result exists', async () => {
    const result: FeedData = {
      etag: null,
      type: 'xml' as const,
      channel: { feedUrl: '' },
      items: [],
    }
    const context = {
      ...baseContext,
      response: new Response('test'),
      result,
    }

    await invalidFeed(context, next)

    expect(next).toHaveBeenCalled()
  })

  describe('should detect HTML pages', () => {
    const testCases = [
      '<!doctype html>',
      '<!DOCTYPE html><html></html>',
      '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN">',
      '<html><head></head></html>',
      '<head><title>Test</title></head>',
      '<body><p>Test</p></body>',
    ]

    testCases.forEach((html) => {
      it(`detects "${html.slice(0, 30)}..."`, async () => {
        const context = {
          ...baseContext,
          response: new Response(html),
        }

        await expect(invalidFeed(context, next)).rejects.toThrow(
          'Invalid feed, signature: HTML page',
        )
      })
    })
  })

  describe('should detect plain text', () => {
    const testCases = [
      'Just plain text',
      '123456789',
      'No XML or HTML here',
      'Text with special chars: &quot; but no tags',
    ]

    testCases.forEach((text) => {
      it(`detects "${text.slice(0, 30)}..."`, async () => {
        const context = {
          ...baseContext,
          response: new Response(text),
        }

        await expect(invalidFeed(context, next)).rejects.toThrow(
          'Invalid feed, signature: Plain text',
        )
      })
    })
  })

  it('should detect empty response', async () => {
    const context = {
      ...baseContext,
      response: new Response(''),
    }

    await expect(invalidFeed(context, next)).rejects.toThrow(
      'Invalid feed, signature: Empty response',
    )
  })

  describe('should accept valid feeds', () => {
    const validFeeds = [
      '<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>',
      '<feed xmlns="http://www.w3.org/2005/Atom"><title>Test</title></feed>',
      '<rss version="2.0"><channel><title>Test</title></channel></rss>',
    ]

    validFeeds.forEach((feed) => {
      it(`accepts "${feed.slice(0, 30)}..."`, async () => {
        const context = {
          ...baseContext,
          response: new Response(feed),
        }

        await invalidFeed(context, next)

        expect(next).toHaveBeenCalled()
      })
    })
  })
})
