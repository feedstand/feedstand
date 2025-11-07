import { describe, expect, it } from 'vitest'
import { parseValue } from './parsers.ts'

describe('parseValue', () => {
  it('should return first successful parsed value', () => {
    const parser1 = (value: string) => (value === 'one' ? 1 : undefined)
    const parser2 = (value: string) => (value === 'two' ? 2 : undefined)

    const result = parseValue('one', [parser1, parser2])

    expect(result).toBe(1)
  })

  it('should try subsequent parsers if previous fail', () => {
    const parser1 = (value: string) => (value === 'one' ? 1 : undefined)
    const parser2 = (value: string) => (value === 'two' ? 2 : undefined)

    const result = parseValue('two', [parser1, parser2])

    expect(result).toBe(2)
  })

  it('should return undefined if no parser succeeds and no fallback provided', () => {
    const parser1 = (value: string) => (value === 'one' ? 1 : undefined)
    const parser2 = (value: string) => (value === 'two' ? 2 : undefined)

    const result = parseValue('three', [parser1, parser2])

    expect(result).toBeUndefined()
  })

  it('should return fallback value if no parser succeeds', () => {
    const parser1 = (value: string) => (value === 'one' ? 1 : undefined)
    const parser2 = (value: string) => (value === 'two' ? 2 : undefined)

    const result = parseValue('three', [parser1, parser2], 0)

    expect(result).toBe(0)
  })

  it('should work with different types', () => {
    const numberParser = (value: unknown) => (typeof value === 'number' ? value : undefined)
    const stringToNumberParser = (value: unknown) =>
      typeof value === 'string' ? Number.parseInt(value, 10) : undefined

    const result = parseValue('123', [numberParser, stringToNumberParser])

    expect(result).toBe(123)
  })
})
