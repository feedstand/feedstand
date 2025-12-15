import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { FetchUrlResponse } from '../../actions/fetchUrl.ts'
import type { WorkflowContext } from '../../helpers/workflows.ts'
import type { FeedData } from '../../types/schemas.ts'
import { guardedPage } from './guardedPage.ts'

describe('guardedPage', () => {
  const mockNext = mock()
  const mockSelf = mock()
  const baseUrl = 'https://example.com/feed'

  const createContext = (responseBody: string, status: number): WorkflowContext<FeedData> => ({
    url: baseUrl,
    response: new FetchUrlResponse(responseBody, {
      url: baseUrl,
      status,
      contentBytes: responseBody.length,
    }),
  })

  beforeEach(() => {
    mockNext.mockClear()
  })

  it('should pass through when no response is present', async () => {
    const context: WorkflowContext<FeedData> = { url: baseUrl }

    await guardedPage(context, mockNext, mockSelf)
    expect(mockNext).toHaveBeenCalledTimes(1)
  })

  it('should pass through when result is already present', async () => {
    const context: WorkflowContext<FeedData> = {
      url: baseUrl,
      response: new FetchUrlResponse('', {
        url: baseUrl,
        status: 200,
        contentBytes: 0,
      }),
      result: {
        meta: {
          etag: null,
          lastModified: null,
          contentBytes: 0,
          hash: '',
          format: 'rss',
          requestUrl: '',
          responseUrl: '',
        },
        channel: { title: 'Test Feed', selfUrl: '' },
        items: [],
      },
    }

    await guardedPage(context, mockNext, mockSelf)
    expect(mockNext).toHaveBeenCalledTimes(1)
  })

  it('should detect one of the guard signatures', async () => {
    const context = createContext('Verifying that you are not a robot...', 200)

    await expect(guardedPage(context, mockNext, mockSelf)).rejects.toThrow(
      'Guarded URL, signature: Unknown',
    )
  })

  it('should pass through when no guarded signature detected', async () => {
    const context = createContext('Regular content', 403)

    await guardedPage(context, mockNext, mockSelf)
    expect(mockNext).toHaveBeenCalledTimes(1)
  })

  it('should preserve original response in context when passing through', async () => {
    const context = createContext('regular content', 200)
    const originalResponse = context.response

    await guardedPage(context, mockNext, mockSelf)
    expect(context.response).toBe(originalResponse)
  })
})
