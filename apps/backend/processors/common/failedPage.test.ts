import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CustomResponse } from '../../actions/fetchUrl.ts'
import type { WorkflowContext } from '../../helpers/workflows.ts'
import { failedPage } from './failedPage.ts'

describe('failedPage', () => {
  const mockNext = vi.fn().mockResolvedValue(undefined)
  const baseContext: WorkflowContext<unknown> = {
    url: 'https://example.com',
    response: new CustomResponse('', { url: '' }),
  }

  beforeEach(() => {
    mockNext.mockClear()
  })

  it('should pass through when no error exists', async () => {
    const context = { ...baseContext }

    await failedPage(context, mockNext)

    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(context.error).toBeUndefined()
  })

  it('should preserve non-Error errors', async () => {
    const context = { ...baseContext, error: 'Simple string error' }

    await failedPage(context, mockNext)

    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(context.error).toBe('Simple string error')
  })

  it('should handle Error causes', async () => {
    const cause = 'Some cause'
    const error = new Error('Surface error', { cause })
    const context = { ...baseContext, error }

    await failedPage(context, mockNext)

    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(context.error).toBe(cause)
  })

  it('should preserve errors without cause', async () => {
    const error = new Error('Regular error')
    const context = { ...baseContext, error }

    await failedPage(context, mockNext)

    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(context.error).toBe(error)
  })
})
