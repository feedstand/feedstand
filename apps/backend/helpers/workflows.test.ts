import { describe, expect, it } from 'vitest'
import { CustomResponse } from '../actions/fetchUrl'
import type { Channel } from '../types/schemas'
import { type WorkflowContext, type WorkflowProcessor, createWorkflow } from './workflows'

describe('createWorkflow', () => {
  type TestResult = { value: string }

  const testChannel: Channel = {
    id: 1,
    title: 'Test',
    description: null,
    siteUrl: 'http://site.com',
    selfUrl: null,
    feedUrl: 'http://site.com/feed',
    feedType: 'rss',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastScannedAt: null,
    lastScanStatus: null,
    lastScanEtag: null,
    lastScanHash: null,
    lastScanError: null,
    lastFixCheckedAt: null,
    lastFixCheckStatus: null,
    lastFixCheckEtag: null,
    lastFixCheckHash: null,
    lastFixCheckError: null,
  }

  it('should execute processors in sequence', async () => {
    const sequence: Array<string> = []

    const processors: Array<WorkflowProcessor<TestResult>> = [
      async (_, next) => {
        sequence.push('first')

        await next()
      },
      async (_, next) => {
        sequence.push('second')

        await next()
      },
      async (context, next) => {
        sequence.push('third')
        context.result = { value: 'success' }

        await next()
      },
    ]

    const workflow = createWorkflow(processors)
    const result = await workflow({ url: 'test' })

    expect(sequence).toEqual(['first', 'second', 'third'])
    expect(result).toEqual({ value: 'success' })
  })

  it('should handle empty processor array', async () => {
    const workflow = createWorkflow<TestResult>([])

    await expect(workflow({ url: 'test' })).rejects.toThrow('Unprocessed pipeline')
  })

  it('should propagate errors thrown in processors', async () => {
    const testError = new Error('Test error')

    const processors: Array<WorkflowProcessor<TestResult>> = [
      async () => {
        throw testError
      },
    ]

    const workflow = createWorkflow(processors)

    await expect(workflow({ url: 'test' })).rejects.toThrow(testError)
  })

  it('should handle errors set in context', async () => {
    const testError = new Error('Context error')

    const processors: Array<WorkflowProcessor<TestResult>> = [
      async (context) => {
        context.error = testError
      },
    ]

    const workflow = createWorkflow(processors)

    await expect(workflow({ url: 'test' })).rejects.toThrow(testError)
  })

  it('should throw unprocessed pipeline error with status code', async () => {
    const processors: Array<WorkflowProcessor<TestResult>> = [
      async (context) => {
        context.response = new CustomResponse(null, { url: '', status: 404 })
      },
    ]

    const workflow = createWorkflow(processors)

    await expect(workflow({ url: 'test' })).rejects.toThrow('Unprocessed pipeline, HTTP code: 404')
  })

  it('should allow processors to modify context', async () => {
    const processors: Array<WorkflowProcessor<TestResult>> = [
      async (context, next) => {
        context.channel = testChannel

        await next()
      },
      async (context, next) => {
        context.result = {
          value: context.channel?.title || 'Unknown',
        }

        await next()
      },
    ]

    const workflow = createWorkflow(processors)
    const result = await workflow({ url: 'test' })

    expect(result).toEqual({ value: 'Test' })
  })

  it('should handle async operations in processors', async () => {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
    const sequence: Array<string> = []

    const processors: Array<WorkflowProcessor<TestResult>> = [
      async (_, next) => {
        await delay(10)

        sequence.push('first')

        await next()
      },
      async (context, next) => {
        await delay(5)

        sequence.push('second')
        context.result = { value: 'async success' }

        await next()
      },
    ]

    const workflow = createWorkflow(processors)
    const result = await workflow({ url: 'test' })

    expect(sequence).toEqual(['first', 'second'])
    expect(result).toEqual({ value: 'async success' })
  })

  it('should allow processors to skip calling next()', async () => {
    const sequence: Array<string> = []

    const processors: Array<WorkflowProcessor<TestResult>> = [
      async (context) => {
        sequence.push('first')
        context.result = { value: 'early exit' }

        // Deliberately not calling next().
      },
      async (_, next) => {
        sequence.push('second')

        await next()
      },
    ]

    const workflow = createWorkflow(processors)
    const result = await workflow({ url: 'test' })

    expect(sequence).toEqual(['first'])
    expect(result).toEqual({ value: 'early exit' })
  })

  it('should preserve context between processors', async () => {
    const context: WorkflowContext<TestResult> = {
      url: 'test',
      response: new CustomResponse(null, { url: '', status: 200 }),
    }

    const processors: Array<WorkflowProcessor<TestResult>> = [
      async (context, next) => {
        expect(context.response?.status).toBe(200)

        context.channel = testChannel

        await next()
      },
      async (context, next) => {
        expect(context.channel?.id).toBe(1)

        context.result = { value: 'preserved' }

        await next()
      },
    ]

    const workflow = createWorkflow(processors)
    const result = await workflow(context)

    expect(result).toEqual({ value: 'preserved' })
  })

  it('should handle nested async operations', async () => {
    const sequence: Array<string> = []
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    const processors: Array<WorkflowProcessor<TestResult>> = [
      async (_, next) => {
        sequence.push('start-outer')

        await next()
        await delay(10)

        sequence.push('end-outer')
      },
      async (context, next) => {
        sequence.push('start-inner')

        await delay(5)

        context.result = { value: 'nested async' }
        sequence.push('end-inner')

        await next()
      },
    ]

    const workflow = createWorkflow(processors)
    const result = await workflow({ url: 'test' })

    expect(sequence).toEqual(['start-outer', 'start-inner', 'end-inner', 'end-outer'])
    expect(result).toEqual({ value: 'nested async' })
  })
})
