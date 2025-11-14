import { describe, expect, it } from 'vitest'
import { convertErrorToString } from './errors.ts'

describe('convertErrorToString', () => {
  it('should convert Error', () => {
    const value = new Error('Test error')
    value.stack = undefined
    const result = convertErrorToString(value)

    expect(result).toBe('Error: Test error')
  })

  it('should handle nested errors when showNestedErrors is true', () => {
    const subError1 = new Error('Sub error 1')
    const subError2 = new Error('Sub error 2')
    const mainError = new AggregateError([subError1, subError2], 'Main error')

    const result = convertErrorToString(mainError, { showNestedErrors: true })

    expect(result).toContain('Main error')
    expect(result).toContain('Sub error 1')
    expect(result).toContain('Sub error 2')
  })

  it('should not show nested errors when showNestedErrors is false', () => {
    const subError = new Error('Sub error')
    const mainError = new AggregateError([subError], 'Main error')

    const result = convertErrorToString(mainError, { showNestedErrors: false })

    expect(result).toContain('Main error')
    expect(result).not.toContain('Sub error')
  })

  it('should convert string to string', () => {
    expect(convertErrorToString('string error')).toBe('string error')
  })

  it('should convert number to string', () => {
    expect(convertErrorToString(42)).toBe('42')
  })

  it('should convert null to string', () => {
    expect(convertErrorToString(null)).toBe('null')
  })

  it('should convert undefined to string', () => {
    expect(convertErrorToString(undefined)).toBe('undefined')
  })

  it('should convert object to string', () => {
    expect(convertErrorToString({})).toBe('[object Object]')
  })

  it('should convert array to string', () => {
    expect(convertErrorToString([1, 2, 3])).toBe('1,2,3')
  })
})
