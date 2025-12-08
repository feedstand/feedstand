import { describe, expect, it } from 'bun:test'
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
    const value = new Date('2024-01-01')
    const result = resolveDate(value)

    expect(result).toBeInstanceOf(Date)
    expect(result?.toISOString().substring(0, 10)).toEqual('2024-01-01')
  })

  it('should parse valid timestamp', () => {
    const value = 1704067200000
    const result = resolveDate(value)

    expect(result).toBeInstanceOf(Date)
    expect(result?.toISOString().startsWith('2024-01-01')).toBeTruthy()
  })

  it('should handle different timezones', () => {
    const value = '2024-01-01T00:00:00+02:00'
    const result = resolveDate(value)

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

  it.each(Object.entries(datesValid))('should parse valid date %s', (value, expected) => {
    const result = resolveDate(value)

    expect(result?.toISOString()).toBe(expected)
  })

  it.each(Object.keys(datesInvalid))('should return undefined for invalid date %s', (value) => {
    const result = resolveDate(value)

    expect(result).toBeUndefined()
  })
})
