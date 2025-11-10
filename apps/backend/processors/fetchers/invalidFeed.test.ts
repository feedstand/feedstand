import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FetchUrlResponse } from '../../actions/fetchUrl.ts'
import type { WorkflowContext } from '../../helpers/workflows.ts'
import type { FeedData } from '../../types/schemas.ts'
import { invalidFeed } from './invalidFeed.ts'

describe('invalidFeed processor', () => {
  const mockNext = vi.fn()
  const mockSelf = vi.fn()
  const baseContext: WorkflowContext<FeedData> = {
    url: 'https://example.com',
    response: new FetchUrlResponse(null, { url: '' }),
  }

  beforeEach(() => {
    mockNext.mockClear()
  })

  it('should pass through when result exists', async () => {
    const result: FeedData = {
      meta: {
        etag: null,
        hash: undefined,
        type: 'rss' as const,
        requestUrl: '',
        responseUrl: '',
      },
      channel: { selfUrl: '' },
      items: [],
    }
    const context = {
      ...baseContext,
      response: new FetchUrlResponse('test', { url: '' }),
      result,
    }

    await invalidFeed(context, mockNext, mockSelf)

    expect(mockNext).toHaveBeenCalled()
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

    for (const testCase of testCases) {
      it(`detects "${testCase.slice(0, 30)}..."`, async () => {
        const context = {
          ...baseContext,
          response: new FetchUrlResponse(testCase, { url: '' }),
        }

        await expect(invalidFeed(context, mockNext, mockSelf)).rejects.toThrow(
          'Invalid feed, signature: HTML page',
        )
      })
    }
  })

  describe('should detect plain text', () => {
    const testCases = [
      'Just plain text',
      '123456789',
      'No XML or HTML here',
      'Text with special chars: &quot; but no tags',
    ]

    for (const testCase of testCases) {
      it(`detects "${testCase.slice(0, 30)}..."`, async () => {
        const context = {
          ...baseContext,
          response: new FetchUrlResponse(testCase, { url: '' }),
        }

        await expect(invalidFeed(context, mockNext, mockSelf)).rejects.toThrow(
          'Invalid feed, signature: Plain text',
        )
      })
    }
  })

  it('should detect empty response', async () => {
    const context = {
      ...baseContext,
      response: new FetchUrlResponse('', { url: '' }),
    }

    await expect(invalidFeed(context, mockNext, mockSelf)).rejects.toThrow(
      'Invalid feed, signature: Empty response',
    )
  })

  describe('should accept valid feeds', () => {
    const validFeeds = [
      '<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>',
      '<feed xmlns="http://www.w3.org/2005/Atom"><title>Test</title></feed>',
      '<rss version="2.0"><channel><title>Test</title></channel></rss>',
    ]

    for (const feed of validFeeds) {
      it(`accepts "${feed.slice(0, 30)}..."`, async () => {
        const context = {
          ...baseContext,
          response: new FetchUrlResponse(feed, { url: '' }),
        }

        await invalidFeed(context, mockNext, mockSelf)

        expect(mockNext).toHaveBeenCalled()
      })
    }
  })
})
