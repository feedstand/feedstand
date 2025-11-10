import { describe, expect, it } from 'vitest'
import dateResolveDateJson from './resolveDate.mock.json' with { type: 'json' }
import { resolveDate } from './resolveDate.ts'

const { datesValid, datesInvalid } = dateResolveDateJson

describe('parsers/resolveDate', () => {
  it('should parse valid date string', () => {
    const result = resolveDate('2024-01-01')

    expect(result).toBeInstanceOf(Date)
    expect(result?.toISOString().substring(0, 10)).toEqual('2024-01-01')
  })

  it('should parse valid Date object', () => {
    const date = new Date('2024-01-01')
    const result = resolveDate(date)

    expect(result).toBeInstanceOf(Date)
    expect(result?.toISOString().substring(0, 10)).toEqual('2024-01-01')
  })

  it('should parse valid timestamp', () => {
    const timestamp = 1704067200000
    const result = resolveDate(timestamp)

    expect(result).toBeInstanceOf(Date)
    expect(result?.toISOString().startsWith('2024-01-01')).toBeTruthy()
  })

  it('should handle different timezones', () => {
    const date = '2024-01-01T00:00:00+02:00'
    const result = resolveDate(date)

    expect(result).toBeInstanceOf(Date)
    // UTC time should be 2 hours behind the input time.
    expect(result?.toISOString()).toBe('2023-12-31T22:00:00.000Z')
  })

  it('should return undefined for invalid date string', () => {
    const result = resolveDate('invalid-date')

    expect(result).toBeUndefined()
  })

  it('should return undefined for null', () => {
    const result = resolveDate(null)

    expect(result).toBeUndefined()
  })

  it('should return undefined for undefined', () => {
    const result = resolveDate(undefined)

    expect(result).toBeUndefined()
  })

  for (const [input, output] of Object.entries(datesValid)) {
    it(`should parse valid date ${input}`, () => {
      const result = resolveDate(input)

      expect(result?.toISOString()).toBe(output)
    })
  }

  for (const input of Object.keys(datesInvalid)) {
    it(`should return undefined for invalid date ${input}`, () => {
      const result = resolveDate(input)

      expect(result).toBeUndefined()
    })
  }
})
