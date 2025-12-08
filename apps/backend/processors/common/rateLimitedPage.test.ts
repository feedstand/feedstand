import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { FetchUrlResponse } from '../../actions/fetchUrl.ts'
import type { WorkflowContext } from '../../helpers/workflows.ts'
import type { FeedData } from '../../types/schemas.ts'
import { rateLimitedPage } from './rateLimitedPage.ts'

mock.module('../../helpers/rateLimits.ts', () => ({
  markRateLimited: mock(),
  getRateLimitDuration: mock(() => 300),
}))

describe('rateLimitedPage', () => {
  const mockNext = mock()
  const mockSelf = mock()

  const createContext = (
    url: string,
    status: number,
    headers?: Record<string, string>,
  ): WorkflowContext<FeedData> => ({
    url,
    response: new FetchUrlResponse('', {
      url,
      status,
      headers,
      contentBytes: 0,
    }),
  })

  beforeEach(() => {
    mockNext.mockClear()
  })

  it('should pass through when no response is present', async () => {
    const context: WorkflowContext<FeedData> = { url: 'https://example.com' }

    await rateLimitedPage(context, mockNext, mockSelf)
    expect(mockNext).toHaveBeenCalledTimes(1)
  })

  it('should pass through when result is already present', async () => {
    const context: WorkflowContext<FeedData> = {
      url: 'https://example.com',
      response: new FetchUrlResponse('', {
        url: 'https://example.com',
        status: 200,
        contentBytes: 0,
      }),
      result: {
        meta: {
          etag: null,
          lastModified: null,
          contentBytes: 0,
          hash: '',
          type: 'rss',
          requestUrl: '',
          responseUrl: '',
        },
        channel: { title: 'Test Feed', selfUrl: '' },
        items: [],
      },
    }

    await rateLimitedPage(context, mockNext, mockSelf)
    expect(mockNext).toHaveBeenCalledTimes(1)
  })

  it('should throw RateLimitError for 429 status', async () => {
    const context = createContext('https://example.com/api', 429)

    await expect(rateLimitedPage(context, mockNext, mockSelf)).rejects.toThrow('Rate limit')
  })

  it('should throw RateLimitError for GitHub 403', async () => {
    const context = createContext('https://github.com/user/repo', 403)

    await expect(rateLimitedPage(context, mockNext, mockSelf)).rejects.toThrow('GitHub')
  })

  it('should throw RateLimitError for GitHub Pages 403', async () => {
    const context = createContext('https://user.github.io/page', 403)

    await expect(rateLimitedPage(context, mockNext, mockSelf)).rejects.toThrow('GitHub')
  })

  it('should NOT throw for non-GitHub 403', async () => {
    const context = createContext('https://example.com/page', 403)

    await rateLimitedPage(context, mockNext, mockSelf)
    expect(mockNext).toHaveBeenCalledTimes(1)
  })

  it('should extract hostname before domain matching (no false positives)', async () => {
    const context = createContext('https://evil.com/?redirect=github.com', 403)

    await rateLimitedPage(context, mockNext, mockSelf)
    expect(mockNext).toHaveBeenCalledTimes(1)
  })

  it('should extract hostname before domain matching (no subdomain false positives)', async () => {
    const context = createContext('https://mygithub.com.evil.io/page', 403)

    await rateLimitedPage(context, mockNext, mockSelf)
    expect(mockNext).toHaveBeenCalledTimes(1)
  })

  it('should correctly match GitHub subdomain', async () => {
    const context = createContext('https://api.github.com/repos', 403)

    await expect(rateLimitedPage(context, mockNext, mockSelf)).rejects.toThrow('GitHub')
  })

  it('should pass through on 200 status', async () => {
    const context = createContext('https://github.com/user/repo', 200)

    await rateLimitedPage(context, mockNext, mockSelf)
    expect(mockNext).toHaveBeenCalledTimes(1)
  })
})
