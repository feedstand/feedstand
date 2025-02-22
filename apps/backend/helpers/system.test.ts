import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { sleep } from './system'

describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('should resolve after specified milliseconds', async () => {
    const ms = 1000
    const spy = vi.fn()

    const promise = sleep(ms).then(spy)

    expect(vi.getTimerCount()).toBe(1)

    vi.advanceTimersByTime(500)
    expect(spy).not.toHaveBeenCalled()

    vi.advanceTimersByTime(500)
    await promise
    expect(spy).toHaveBeenCalledOnce()
  })

  test('should handle zero milliseconds', async () => {
    const spy = vi.fn()

    const promise = sleep(0).then(spy)
    expect(vi.getTimerCount()).toBe(1)

    vi.runAllTimers()
    await promise
    expect(spy).toHaveBeenCalledOnce()
  })

  test('should handle negative values as immediate resolution', async () => {
    const spy = vi.fn()

    const promise = sleep(-500).then(spy)
    expect(vi.getTimerCount()).toBe(1)

    vi.runAllTimers()
    await promise
    expect(spy).toHaveBeenCalledOnce()
  })

  test('should use correct setTimeout parameters', () => {
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout')
    const ms = 1500

    sleep(ms)

    expect(setTimeoutSpy).toHaveBeenCalledOnce()
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), ms)
  })

  test('should not resolve before timeout completes', async () => {
    const ms = 2000
    const spy = vi.fn()

    const promise = sleep(ms).then(spy)

    vi.advanceTimersByTime(1999)
    expect(spy).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    await promise
    expect(spy).toHaveBeenCalledOnce()
  })
})
